import { describe, expect, it } from 'vitest';
import { isBarcode, productFromOff, productsFromSearch } from './openFoodFacts';

const NOW = '2026-11-20T12:00:00.000Z';

describe('Open Food Facts answers', () => {
  it('becomes a product with Polish name, brand, values per 100 g and a portion', () => {
    const p = productFromOff(
      {
        status: 1,
        product: {
          product_name: 'Oat flakes',
          product_name_pl: 'Płatki owsiane górskie',
          brands: 'Melvit, Inna',
          serving_quantity: 40,
          nutriments: { 'energy-kcal_100g': 372, proteins_100g: 13.5, fat_100g: 7, carbohydrates_100g: 58.7, fiber_100g: 10, sugars_100g: 1.1, salt_100g: '0,01' },
        },
      },
      '5906827001229',
      NOW,
    );
    expect(p).toMatchObject({
      name: 'Płatki owsiane górskie',
      brand: 'Melvit',
      barcode: '5906827001229',
      per100: { kcal: 372, protein: 13.5, fat: 7, carbs: 58.7, fiber: 10, sugar: 1.1, salt: 0.01 },
      portions: [{ name: '1 porcja', grams: 40 }],
      source: 'openfoodfacts',
    });
  });

  it('works out kcal from kJ when only those are given', () => {
    const p = productFromOff({ status: 1, product: { product_name: 'X', nutriments: { energy_100g: 1674, proteins_100g: 5 } } }, '12345678', NOW);
    expect(p?.per100.kcal).toBe(400);
  });

  it('is null for an unknown product or one without a nutrition table', () => {
    expect(productFromOff({ status: 0 }, '12345678', NOW)).toBeNull();
    expect(productFromOff({ status: 1, product: { product_name: 'X', nutriments: {} } }, '12345678', NOW)).toBeNull();
    expect(productFromOff('nonsense', '12345678', NOW)).toBeNull();
  });

  it('recognises barcodes', () => {
    expect(isBarcode('5906827001229')).toBe(true);
    expect(isBarcode('12345')).toBe(false);
    expect(isBarcode('59068270a1229')).toBe(false);
  });
});

describe('searching Open Food Facts by name', () => {
  it('keeps products with a nutrition table and a real barcode', () => {
    const json = {
      products: [
        { code: '5900000000001', product_name: 'Skyr', nutriments: { 'energy-kcal_100g': 63, proteins_100g: 11, fat_100g: 0.2, carbohydrates_100g: 4 } },
        { code: '5900000000002', product_name: 'Bez tabeli', nutriments: {} },
        { code: 'abc', product_name: 'Bez kodu', nutriments: { 'energy-kcal_100g': 100 } },
      ],
    };
    const found = productsFromSearch(json, 'now');
    expect(found.map((p) => [p.name, p.barcode])).toEqual([
      ['Skyr', '5900000000001'],
      ['Bez kodu', undefined],
    ]);
  });
});
