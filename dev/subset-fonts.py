#!/usr/bin/env python3
"""Rebuilds fonts/ from IBM Plex, keeping only the characters the pages use.

    npm pack @ibm/plex-sans @ibm/plex-mono      # then unpack both .tgz files
    pip install fonttools brotli
    python3 dev/subset-fonts.py path/to/plex-sans/package path/to/plex-mono/package

Run it again after adding text with new symbols to js/content.js. The subsets are renamed
Recap Sans and Recap Mono, because the font licence (SIL OFL 1.1, fonts/OFL.txt) reserves
the name "Plex" for the original fonts.
"""

import glob
import os
import subprocess
import sys
import tempfile

from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = ('U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+0300-0304,U+0308,'
        'U+0391-03A9,U+03B1-03C9,U+2002-2015,U+2018-201E,U+2020-2022,U+2026,U+2030,U+2032-2033,'
        'U+2039-203A,U+2070-209F,U+20AC,U+2122,U+2190-2195,U+2211-2215,U+2219-221A,U+221E,U+2248,'
        'U+2260,U+2264-2265,U+25B8,U+25CB,U+25CF,U+2713,U+2717')


def used_characters():
    chars = set()
    for f in glob.glob(os.path.join(ROOT, 'js', '*.js')) + glob.glob(os.path.join(ROOT, '*.html')):
        with open(f, encoding='utf8') as fh:
            chars |= set(fh.read())
    return ','.join('U+%04X' % ord(c) for c in sorted(chars) if ord(c) > 0x7E)


def main(sans, mono):
    jobs = [(sans, 'IBMPlexSans-Regular', 'RecapSans-Regular'), (sans, 'IBMPlexSans-Italic', 'RecapSans-Italic'),
            (sans, 'IBMPlexSans-Medium', 'RecapSans-Medium'), (sans, 'IBMPlexSans-SemiBold', 'RecapSans-SemiBold'),
            (mono, 'IBMPlexMono-Regular', 'RecapMono-Regular')]
    unicodes = BASE + ',' + used_characters()
    with tempfile.TemporaryDirectory() as tmp:
        for pkg, src, dst in jobs:
            out = os.path.join(tmp, dst + '.woff2')
            subprocess.run(['pyftsubset', os.path.join(pkg, 'fonts', 'complete', 'woff2', src + '.woff2'),
                            '--unicodes=' + unicodes, '--flavor=woff2', '--output-file=' + out, '--no-hinting',
                            '--layout-features=kern,liga,calt,ccmp,mark,mkmk,locl,tnum,pnum,lnum'], check=True)
            font = TTFont(out)
            for rec in font['name'].names:
                if rec.nameID in (1, 3, 4, 6, 16, 17, 18, 21, 22, 25):
                    rec.string = (rec.toUnicode().replace('IBM Plex Sans', 'Recap Sans').replace('IBMPlexSans', 'RecapSans')
                                  .replace('IBM Plex Mono', 'Recap Mono').replace('IBMPlexMono', 'RecapMono').replace('Plex', 'Recap'))
            font.flavor = 'woff2'
            font.save(os.path.join(ROOT, 'fonts', dst + '.woff2'))
            print(dst, os.path.getsize(os.path.join(ROOT, 'fonts', dst + '.woff2')), 'bytes')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
