"""Generate an After Effects pseudo effect (.ffx) from a control description.

The .ffx format is a RIFX container holding two parallel descriptions of the
effect's parameters — `parT` (the parameter definitions) and `tdgp` (the
matching dynamic streams) — followed by the JSON control array that
`DuAEPseudoEffect` parses to map parameter names to indices.

`build()` was reverse engineered from the presets in
`src/Scripts/ScriptUI Panels/inc/pe`; it reproduces most of them byte for byte
from their own control array (see `test_ffx.py`).
"""
import struct, json

# ---------- low level ----------

def _chunk(cid, payload):
    out = cid + struct.pack('>I', len(payload)) + payload
    if len(payload) & 1:
        out += b'\x00'
    return out

def _list(ltype, payload):
    return _chunk(b'LIST', ltype + payload)

def _fixed(s, size):
    b = s.encode('latin-1')
    if len(b) >= size:
        raise ValueError('string too long (max %d): %r' % (size - 1, s))
    return b + b'\x00' * (size - len(b))

def _chunk_str(s):
    return s.encode('latin-1') + b'\x00'

def _f64(v):
    return struct.pack('>d', float(v))

CDAT_DOUBLES = {'point': 6, 'point3d': 9, 'color': 12}

def _cdat(ctype, *values):
    """Default-value payload: a fixed number of doubles, per control type."""
    n = CDAT_DOUBLES.get(ctype, 5)
    vals = list(values) + [0.0] * (n - len(values))
    return b''.join(_f64(v) for v in vals[:n])

# PF_Param_* type ids
T_LAYER, T_ANGLE, T_CHECKBOX, T_COLOR = 0, 3, 4, 5
T_POINT, T_POPUP, T_SLIDER = 6, 7, 10
T_GROUP, T_ENDGROUP, T_POINT3D = 13, 14, 18

TYPE_IDS = {
    'layer': T_LAYER, 'angle': T_ANGLE, 'checkbox': T_CHECKBOX, 'color': T_COLOR,
    'point': T_POINT, 'popup': T_POPUP, 'slider': T_SLIDER,
    'group': T_GROUP, 'endgroup': T_ENDGROUP, 'point3d': T_POINT3D,
}

# tdb4[8:12] discriminator, observed per type
TDB4_KIND = {
    'layer':    b'\x00\x01\x00\xff',
    'angle':    b'\x00\x01\x00\xff',
    'checkbox': b'\x00\x01\x00\x04',
    'popup':    b'\x00\x01\x00\x04',
    'color':    b'\x00\x02\xff\xff',
    'point':    b'\xff\xff\xff\xff',
    'point3d':  b'\xff\xff\xff\xff',
    'group':    b'\x00\x01\x00\x04',
    'endgroup': b'\x00\x01\x00\x04',
}


def _pard(ptype, name, extra=b'', flags4=0, no_keyframes=False):
    """The 148-byte parameter definition.

    `extra` is the per-type value block, which starts right after the flags at
    offset 52.
    """
    p = bytearray(148)
    struct.pack_into('>I', p, 4, flags4)
    struct.pack_into('>I', p, 12, ptype)
    p[16:48] = _fixed(name, 32)
    # PF_ParamFlag_CANNOT_TIME_VARY
    struct.pack_into('>I', p, 48, 2 if no_keyframes else 0)
    if extra:
        p[52:52 + len(extra)] = extra
    return bytes(p)


def _tdb4(ctl):
    """The 124-byte dynamic stream descriptor."""
    t = ctl['type']
    b = bytearray(124)
    # header
    if t in ('slider', 'angle', 'color', 'group', 'endgroup', 'text'):
        b[0:2] = b'\xbd\x99'
    else:
        b[0:2] = b'\xdb\x99'
    if t == 'color':
        b[2:8] = b'\x00\x04\x00\x07\x00\x01'
    elif t == 'point':
        b[2:8] = b'\x00\x02\x00\x0f\x00\x03'
    elif t == 'point3d':
        b[2:8] = b'\x00\x03\x00\x0f\x00\x03'
    else:
        b[2:8] = b'\x00\x01\x00\x01\x00\x00'
    if t in ('slider', 'angle'):
        b[8:12] = b'\x00\x01\x00\x04' if ctl.get('hold') else b'\x00\x01\x00\xff'
    else:
        b[8:12] = TDB4_KIND.get(t, b'\x00\x01\x00\x04')
    b[12:16] = b'\x00\x00\x5d\xa8'
    if t in ('layer', 'checkbox', 'popup', 'point', 'point3d'):
        # unit scale block, only present on the "db99" flavours
        b[16:24] = bytes.fromhex('3d9b7cdfd9d7bdbc' if t in ('point', 'point3d')
                                 else '3f1a36e2eb1c432d')
        for i in range(4):
            b[24 + i * 8:32 + i * 8] = _f64(1.0)
        struct.pack_into('>I', b, 56, 8 if t == 'point3d' else 4)
        b[60] = {'point': 6, 'point3d': 9}.get(t, 4)
        if t in ('point', 'point3d'):
            b[79] = 1
    return bytes(b)


def _stream(ctl, name):
    """The LIST(tdbs) body for one parameter."""
    t = ctl['type']
    parts = [_chunk(b'tdsb', struct.pack('>I', 3 if ctl.get('invisible') else 1)),
             _chunk(b'tdsn', _chunk_str(name)),
             _chunk(b'tdb4', _tdb4(ctl))]

    if t == 'checkbox':
        parts.append(_chunk(b'cdat', _cdat(t, 1.0 if ctl.get('default') else 0.0)))
    elif t == 'popup':
        parts.append(_chunk(b'cdat', _cdat(t, ctl.get('default', 1))))
    elif t in ('slider', 'angle'):
        parts.append(_chunk(b'cdat', _cdat(t, ctl.get('default', 0))))
    elif t == 'color':
        parts.append(_chunk(b'cdat', _cdat(t, 255.0,
            ctl.get('default_red', 0), ctl.get('default_green', 0),
            ctl.get('default_blue', 0))))
    elif t == 'point':
        parts.append(_chunk(b'cdat', _cdat(t, ctl.get('default_x', 0), ctl.get('default_y', 0))))
    elif t == 'point3d':
        parts.append(_chunk(b'cdat', _cdat(t, ctl.get('default_x', 0), ctl.get('default_y', 0),
                                           ctl.get('default_z', 0))))
    else:
        parts.append(_chunk(b'cdat', _cdat(t)))

    if t == 'slider':
        parts.append(_chunk(b'tdum', _f64(ctl.get('smin', 0))))
        parts.append(_chunk(b'tduM', _f64(ctl.get('smax', 0))))
    if t in ('layer', 'endgroup'):
        parts.append(_chunk(b'tdpi', struct.pack('>I', 0 if t == 'layer' else 14)))
    return b''.join(parts)


def _params(controls):
    """Expand the control array into the flat parameter list AE stores.

    A `text` control is stored as an empty, dimmed group (group start + group end).
    """
    out = []
    for c in controls:
        t = c['type']
        if t == 'text':
            out.append(dict(c, type='group', _dim=True))
            out.append({'type': 'endgroup'})
        else:
            out.append(c)
    return out


def _pard_for(ctl):
    t = ctl['type']
    name = ctl.get('name', '')
    nokf = ctl.get('keyframes') is False
    if t == 'layer':
        return _pard(T_LAYER, name, no_keyframes=True)
    if t == 'checkbox':
        extra = bytearray(12)
        extra[8] = 1 if ctl.get('default') else 0
        return _pard(T_CHECKBOX, name, bytes(extra), no_keyframes=nokf)
    if t == 'popup':
        # AE reads the option list from the pdnm chunk; the count field is a constant.
        dflt = int(ctl.get('default', 1))
        extra = struct.pack('>IIHH', 0, dflt, 3, dflt)
        return _pard(T_POPUP, name, extra, no_keyframes=nokf)
    if t == 'slider':
        extra = bytearray(76)
        struct.pack_into('>f', extra, 52, float(ctl.get('vmin', 0)))
        struct.pack_into('>f', extra, 56, float(ctl.get('vmax', 0)))
        struct.pack_into('>f', extra, 60, float(ctl.get('smin', 0)))
        struct.pack_into('>f', extra, 64, float(ctl.get('smax', 0)))
        struct.pack_into('>f', extra, 68, float(ctl.get('default', 0)))
        struct.pack_into('>H', extra, 72, int(ctl.get('precision', 0)))
        struct.pack_into('>H', extra, 74,
                         (1 if ctl.get('percent') else 0) | (2 if ctl.get('pixel') else 0))
        return _pard(T_SLIDER, name, bytes(extra), no_keyframes=nokf)
    if t == 'angle':
        extra = bytearray(12)
        struct.pack_into('>i', extra, 8, int(round(float(ctl.get('default', 0)) * 65536)))
        return _pard(T_ANGLE, name, bytes(extra), no_keyframes=nokf)
    if t == 'color':
        extra = bytearray(12)
        extra[6:12] = bytes([0xff, 0xff, 0xff, ctl.get('default_red', 0),
                             ctl.get('default_green', 0), ctl.get('default_blue', 0)])
        return _pard(T_COLOR, name, bytes(extra), no_keyframes=nokf)
    if t in ('point', 'point3d'):
        return _pard(TYPE_IDS[t], name, no_keyframes=nokf)
    if t == 'group':
        return _pard(T_GROUP, name, flags4=0x20 if ctl.get('_dim') else 0)
    if t == 'endgroup':
        return _pard(T_ENDGROUP, '')
    raise ValueError('unknown control type %r' % t)


def build(control_name, matchname, controls):
    """Return the bytes of a .ffx pseudo effect."""
    params = _params(controls)
    # index 0 is the effect's own (hidden) input-layer parameter
    n = len(params) + 1

    par_parts = [_chunk(b'parn', struct.pack('>I', n))]
    root_pard = bytearray(_pard(T_LAYER, '', struct.pack('>II', 0, 14),
                                no_keyframes=True))
    root_pard[128:132] = b'\xff\xff\xff\xff'
    par_parts.append(_chunk(b'tdmn', _fixed(matchname + '-0000', 40)))
    par_parts.append(_chunk(b'pard', bytes(root_pard)))
    for i, ctl in enumerate(params):
        par_parts.append(_chunk(b'tdmn', _fixed('%s-%04d' % (matchname, i + 1), 40)))
        par_parts.append(_chunk(b'pard', _pard_for(ctl)))
        if ctl['type'] == 'checkbox':
            par_parts.append(_chunk(b'pdnm', _chunk_str(ctl.get('label', ''))))
        elif ctl['type'] == 'popup':
            par_parts.append(_chunk(b'pdnm', _chunk_str(ctl.get('options', ''))))
    parT = _list(b'parT', b''.join(par_parts))

    root_stream = bytearray(124)
    root_stream[0:2] = b'\xdb\x99'
    root_stream[2:16] = bytes.fromhex('000100010000000100000000' + '0258')
    root_stream[16:24] = bytes.fromhex('3f1a36e2eb1c432d')
    for i in range(4):
        root_stream[24 + i * 8:32 + i * 8] = _f64(1.0)
    struct.pack_into('>I', root_stream, 56, 4)
    root_stream[60:72] = bytes.fromhex('04c0c0c0ffc0c0c000000000')
    root_stream[72] = 0x80

    gp_parts = [_chunk(b'tdsb', struct.pack('>I', 1)),
                _chunk(b'tdsn', _chunk_str(control_name)),
                _chunk(b'tdmn', _fixed(matchname + '-0000', 40)),
                _list(b'tdbs', _chunk(b'tdsb', struct.pack('>I', 3))
                      + _chunk(b'tdsn', _chunk_str(''))
                      + _chunk(b'tdb4', bytes(root_stream))
                      + _chunk(b'cdat', _cdat('layer'))
                      + _chunk(b'tdpi', struct.pack('>I', 14)))]
    for i, ctl in enumerate(params):
        name = ctl.get('name', '') if ctl['type'] != 'endgroup' else control_name
        gp_parts.append(_chunk(b'tdmn', _fixed('%s-%04d' % (matchname, i + 1), 40)))
        gp_parts.append(_list(b'tdbs', _stream(ctl, name)))
    gp_parts.append(_chunk(b'tdmn', _fixed('ADBE Group End', 40)))
    tdgp = _list(b'tdgp', b''.join(gp_parts))

    sspc = _list(b'sspc', _chunk(b'fnam', _fixed('', 48)) + parT + tdgp)

    tdsp1 = _list(b'tdsp',
                  _chunk(b'tdot', b'\xff\xff\xff\xff')
                  + _chunk(b'tdpl', struct.pack('>I', 2))
                  + _list(b'tdsi', _chunk(b'tdix', b'\xff\xff\xff\xff')
                          + _chunk(b'tdmn', _fixed('ADBE Effect Parade', 40)))
                  + _list(b'tdsi', _chunk(b'tdix', struct.pack('>I', 0))
                          + _chunk(b'tdmn', _fixed(matchname, 40))))
    tdsp2 = _list(b'tdsp',
                  _chunk(b'tdot', b'\xff\xff\xff\xff')
                  + _chunk(b'tdpl', struct.pack('>I', 1))
                  + _list(b'tdsi', _chunk(b'tdix', b'\xff\xff\xff\xff')
                          + _chunk(b'tdmn', _fixed('ADBE End of path sentinel', 40))))

    beso = _chunk(b'beso', bytes.fromhex(
        '00000001000000010000000000005da8001df85200000000'
        '0064006400640064' + '3ff0000000000000' + '3ff0000000000000'
        + '00000000' + 'ffffffff'))
    besc = _list(b'besc', beso + tdsp1 + _chunk(b'tdsn', _chunk_str(control_name))
                 + tdsp2 + sspc)

    head = _chunk(b'head', bytes.fromhex('00000003000000440000000101000000'))
    body = b'FaFX' + head + besc
    riff = b'RIFX' + struct.pack('>I', len(body)) + body

    meta = {
        'controlName': control_name,
        'matchname': matchname,
        'controlArray': controls,
    }
    # Non-ASCII characters are stored as raw latin-1 bytes, not \u escapes.
    return riff + json.dumps(meta, separators=(',', ':'),
                             ensure_ascii=False).encode('latin-1')


# ---------- .jsxinc encoding ----------
SHORT = {0x08: '\\b', 0x09: '\\t', 0x0a: '\\n', 0x0c: '\\f', 0x0d: '\\r'}


def encode(data: bytes) -> str:
    out = []
    for b in data:
        c = chr(b)
        if b == 0x22:      # "
            out.append('\\"')
        elif b == 0x5c:    # backslash
            out.append('\\\\')
        elif 0x20 <= b < 0x7f:
            out.append(c)
        elif b in SHORT:
            out.append(SHORT[b])
        elif b < 0x80:
            out.append('\\x%02X' % b)
        else:
            out.append('\\u%04X' % b)
    return ''.join(out)


def to_jsxinc(data: bytes, var_name: str, file_name: str, category: str) -> str:
    return ('var %s = new DuBinary( "%s", "%s", "%s" );\n%s;\n'
            % (var_name, encode(data), file_name, category, var_name))
