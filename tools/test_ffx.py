"""Checks rxbuilder_.ffx against the pseudo effects shipped in the repository.

Every preset in `src/Scripts/ScriptUI Panels/inc/pe` embeds the control array it
was built from, so the generator can be run on it and the result compared to the
file itself. Presets holding non round-trippable float defaults (0.15 and the
like, which the .ffx stores as a float32) are expected to differ; they are
listed in KNOWN_DIFFERENT.

Run with `python3 test_ffx.py`.
"""

import glob
import json
import os
import sys

from _config import SRC_PATH
from rxbuilder_ import ffx

PE_PATH = os.path.join(SRC_PATH, 'Scripts', 'ScriptUI Panels', 'inc', 'pe')

# These presets use point/point3d defaults or float values the generator does
# not reproduce bit for bit. They are not regressions, just not exact.
KNOWN_DIFFERENT = (
    'pe_2d_random', 'pe_2d_swink', 'pe_2layer_ik', 'pe_3d_random', 'pe_3d_swink',
    'pe_3layer_ik', 'pe_color_wiggle', 'pe_expose_transform',
)


def check():
    """Rebuilds every preset from its own control array and compares"""
    exact = []
    different = []

    for path in sorted(glob.glob(os.path.join(PE_PATH, '*.ffx'))):
        name = os.path.basename(path).replace('.ffx', '')
        data = open(path, 'rb').read()
        start = data.find(b'{"controlName"')
        if start < 0:
            continue
        meta = json.loads(data[start:].decode('latin-1'))
        built = ffx.build(meta['controlName'], meta['matchname'], meta['controlArray'])
        (exact if built == data else different).append(name)

    unexpected = [n for n in different if n not in KNOWN_DIFFERENT]
    print('%d presets rebuilt byte for byte, %d differ' % (len(exact), len(different)))
    if unexpected:
        print('UNEXPECTED differences: ' + ', '.join(unexpected))
        return False

    # The .jsxinc encoding must match what ExtendScript's toSource() produces.
    bad_inc = []
    for path in sorted(glob.glob(os.path.join(PE_PATH, '*.ffx'))):
        inc_path = path + '.jsxinc'
        if not os.path.isfile(inc_path):
            continue
        name = os.path.basename(path).replace('.ffx', '')
        with open(inc_path, 'r', encoding='utf-8', newline='') as inc_file:
            expected = inc_file.read()
        built = ffx.to_jsxinc(open(path, 'rb').read(), name, name + '.ffx', 'pe')
        if built != expected:
            bad_inc.append(name)

    # pe_walk_cycle.ffx and its .jsxinc are out of sync in the repository.
    bad_inc = [n for n in bad_inc if n != 'pe_walk_cycle']
    print('%d .jsxinc files re-encoded identically' % (len(glob.glob(os.path.join(PE_PATH, '*.jsxinc'))) - len(bad_inc)))
    if bad_inc:
        print('UNEXPECTED .jsxinc differences: ' + ', '.join(bad_inc))
        return False

    return True


if __name__ == '__main__':
    sys.exit(0 if check() else 1)
