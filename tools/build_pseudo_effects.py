"""Builds the .ffx pseudo effects described in tools/pseudo_effects.

Each spec is a JSON file holding the effect's match name and its control array;
the .ffx binary and the .ffx.jsxinc it is embedded in are generated from it, so
a pseudo effect can be changed without going through After Effects.

Run without arguments to rebuild every spec, or pass spec names to rebuild only
those (e.g. `python3 build_pseudo_effects.py copy_location`).
"""

import json
import os
import sys

from _config import SRC_PATH
from rxbuilder_ import ffx

SPECS_PATH = os.path.join(os.path.dirname(__file__), 'pseudo_effects')

# After Effects refuses to apply a pseudo effect whose match name is too long, without
# telling why: "Pseudo/DUIK copyPointLocation v2" (32 characters) failed. None of the match
# names known to work is longer than this.
MAX_MATCHNAME_LENGTH = 30
PE_PATH = os.path.join(SRC_PATH, 'Scripts', 'ScriptUI Panels', 'inc', 'pe')


def build_spec(spec_path):
    """Builds a single spec, returns the path of the .ffx file"""
    with open(spec_path, 'r', encoding='utf-8') as spec_file:
        spec = json.load(spec_file)

    name = spec.get('file', os.path.basename(spec_path).replace('.json', ''))
    if len(spec['matchname']) > MAX_MATCHNAME_LENGTH:
        raise ValueError('%s: the match name %r is longer than %d characters'
                         % (name, spec['matchname'], MAX_MATCHNAME_LENGTH))
    data = ffx.build(spec['controlName'], spec['matchname'], spec['controlArray'])

    ffx_path = os.path.join(PE_PATH, name + '.ffx')
    with open(ffx_path, 'wb') as ffx_file:
        ffx_file.write(data)

    jsxinc = ffx.to_jsxinc(data, name, name + '.ffx', 'pe')
    with open(ffx_path + '.jsxinc', 'w', encoding='utf-8', newline='') as inc_file:
        inc_file.write(jsxinc)

    print('>> Built ' + name + '.ffx (' + str(len(data)) + ' bytes)')
    return ffx_path


def build(names=()):
    """Builds all the specs, or only the given ones"""
    for spec_name in sorted(os.listdir(SPECS_PATH)):
        if not spec_name.endswith('.json'):
            continue
        if names and spec_name.replace('.json', '') not in names:
            continue
        build_spec(os.path.join(SPECS_PATH, spec_name))


if __name__ == '__main__':
    build(sys.argv[1:])
