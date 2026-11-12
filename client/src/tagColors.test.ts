import { describe, expect, it } from 'vitest';
import { darken, nextTagColor, TAG_PALETTE } from './tagColors';

describe('nextTagColor', () => {
    it('starts with the first palette color', () => {
        expect(nextTagColor([])).toBe(TAG_PALETTE[0]);
    });

    it('picks the least-used color, ties going to palette order', () => {
        expect(nextTagColor([TAG_PALETTE[0], TAG_PALETTE[1]])).toBe(TAG_PALETTE[2]);
        expect(nextTagColor([...TAG_PALETTE, TAG_PALETTE[0], TAG_PALETTE[2]])).toBe(TAG_PALETTE[1]);
    });

    it('ignores off-palette colors and compares case-insensitively', () => {
        expect(nextTagColor(['#c1d5f5', '#C1D5F5', TAG_PALETTE[0].toUpperCase()])).toBe(TAG_PALETTE[1]);
    });
});

describe('darken', () => {
    it('mixes a color toward black', () => {
        expect(darken('#ffffff')).toBe('#b3b3b3');
        expect(darken('#e03131', 0.5)).toBe('#701919');
        expect(darken('#000000')).toBe('#000000');
    });
});
