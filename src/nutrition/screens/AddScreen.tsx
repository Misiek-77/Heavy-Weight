import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dayKey } from '../../shared/date';
import { formatWhole, searchKey } from '../../shared/format';
import { Header } from '../../shared/Header';
import { Icon } from '../../shared/Icon';
import { newId } from '../../shared/id';
import { Sheet } from '../../shared/Sheet';
import { BASIC_FOODS, type BasicFood } from '../data/basics';
import { lookupBarcode, searchProducts } from '../data/openFoodFacts';
import { MEALS, type Meal, type Product } from '../domain/types';
import { useNutrition } from '../state/nutritionContext';
import { BarcodeScanner } from './BarcodeScanner';
import { foundList, LabelPhoto } from './LabelPhoto';
import { AmountForm, MEAL_LABEL } from './parts';
import type { ProductDraftState } from './ProductForm';

/** Picks what was eaten for a meal: from the person's products, by barcode, or as a new product. */
export function AddScreen() {
  const store = useNutrition();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const meal: Meal = (MEALS as readonly string[]).includes(params.get('posilek') ?? '') ? (params.get('posilek') as Meal) : 'snack';
  const date = params.get('dzien') ?? dayKey(new Date());
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Product | null>(() => store.products.find((p) => p.id === params.get('produkt')) ?? null);
  const [scanning, setScanning] = useState(false);
  const [looking, setLooking] = useState<string | null>(null);
  /** Open Food Facts search for the current words: null before asking. */
  const [online, setOnline] = useState<{ query: string; state: 'searching' | 'offline' | 'error' | Product[] } | null>(null);
  const back = `/dieta${date === dayKey(new Date()) ? '' : `?dzien=${date}`}`;

  // Products by when they were last eaten, most recent first; never-eaten ones after, favourites leading.
  const ordered = useMemo(() => {
    const lastUse = new Map<string, string>();
    for (const e of store.entries) if ((lastUse.get(e.productId) ?? '') < e.createdAt) lastUse.set(e.productId, e.createdAt);
    return [...store.products].sort(
      (a, b) =>
        Number(!!b.favorite) - Number(!!a.favorite) ||
        (lastUse.get(b.id) ?? '').localeCompare(lastUse.get(a.id) ?? '') ||
        a.name.localeCompare(b.name, 'pl'),
    );
  }, [store.products, store.entries]);
  const key = searchKey(query.trim());
  const shown = key ? ordered.filter((p) => searchKey(`${p.name} ${p.brand ?? ''}`).includes(key)) : ordered.slice(0, 30);
  // Common foods from the built-in list, unless already among the person's products under the same name.
  const mine = new Set(store.products.map((p) => p.name));
  const basics = key ? BASIC_FOODS.filter((f) => !mine.has(f.name) && searchKey(f.name).includes(key)).slice(0, 20) : [];
  const onlineResult = online && online.query === query.trim() ? online.state : null;

  function pickBasic(food: BasicFood) {
    const product: Product = { id: newId(), name: food.name, per100: food.per100, portions: food.portions, source: 'basic', updatedAt: new Date().toISOString() };
    store.saveProduct(product);
    setPicked(product);
  }

  async function searchOnline() {
    const q = query.trim();
    setOnline({ query: q, state: 'searching' });
    const result = await searchProducts(q, new Date().toISOString());
    setOnline({ query: q, state: result.kind === 'found' ? result.products : result.kind });
  }

  const toForm = (state: ProductDraftState) => navigate('/dieta/produkt/nowy', { state: { ...state, meal, date } });

  const onCode = useCallback(
    async (code: string) => {
      setScanning(false);
      const mine = store.products.find((p) => p.barcode === code);
      if (mine) {
        setPicked(mine);
        return;
      }
      setLooking(code);
      const result = await lookupBarcode(code, new Date().toISOString());
      setLooking(null);
      if (result.kind === 'found') toForm({ draft: result.product, notice: 'Znaleziono w bazie Open Food Facts. Sprawdź wartości z etykietą i zapisz.' });
      else
        toForm({
          barcode: code,
          notice:
            result.kind === 'unknown'
              ? 'Tego produktu nie ma w bazie. Przepisz wartości z etykiety (na 100 g) — następnym razem znajdzie się od razu.'
              : 'Brak połączenia z internetem. Przepisz wartości z etykiety (na 100 g).',
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.products, meal, date],
  );

  return (
    <main className="screen">
      <Header back={back} />
      <h1 className="title">{MEAL_LABEL[meal]}</h1>
      <p className="subtitle">Dodaj produkt do posiłku</p>

      <div className="add-actions">
        <button type="button" className="btn btn-primary" onClick={() => setScanning(true)}>
          <Icon name="barcode" />
          Skanuj kod
        </button>
        <button type="button" className="btn" onClick={() => toForm({})}>
          <Icon name="plus" />
          Nowy produkt
        </button>
      </div>
      <div className="add-actions">
        <LabelPhoto
          label="Zdjęcie etykiety"
          className="btn"
          onRead={(reading, text) => {
            const { found, missing } = foundList(reading);
            toForm({
              label: reading.values,
              ocrText: text,
              notice: found
                ? `Odczytano z etykiety: ${found}${reading.portionGrams ? ` (przeliczone z porcji ${reading.portionGrams} g na 100 g)` : ''}.${missing ? ` Nie znaleziono: ${missing} — wpisz ręcznie.` : ''} Sprawdź wszystko z etykietą i wpisz nazwę.`
                : 'Nie udało się znaleźć wartości na zdjęciu. Spróbuj zdjęcia samej tabeli z bliska albo wpisz wartości ręcznie.',
            });
          }}
        />
        <button type="button" className="btn" onClick={() => navigate('/dieta/danie/nowe', { state: { meal, date } })}>
          <Icon name="dish" />
          Nowe danie
        </button>
      </div>
      {looking && (
        <p className="note" role="status" style={{ marginTop: 12 }}>
          Szukam produktu {looking} w bazie…
        </p>
      )}

      <section className="section">
        <input className="input" type="search" placeholder="Szukaj: moje produkty i baza" aria-label="Szukaj produktu" value={query} onChange={(e) => setQuery(e.target.value)} />
        {store.products.length === 0 && !key ? (
          <p className="empty">Wpisz nazwę, np. „jajko” albo „ryż”, zeskanuj kod kreskowy albo dodaj produkt z etykiety.</p>
        ) : shown.length === 0 ? (
          key ? null : <p className="empty">Nic nie pasuje.</p>
        ) : (
          <ul className="list">
            {shown.map((p) => (
              <li key={p.id}>
                <button type="button" className="item" onClick={() => setPicked(p)}>
                  <span className="item-main">
                    <span className="item-title">
                      {p.favorite && <span aria-label="Ulubiony">★ </span>}
                      {p.name}
                    </span>
                    <span className="item-sub">
                      {p.brand ? `${p.brand} · ` : ''}
                      {formatWhole(p.per100.kcal)} kcal / 100 g
                    </span>
                  </span>
                  <span className="item-end">
                    <Icon name="plus" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {basics.length > 0 && (
          <>
            <h2 className="label" style={{ marginTop: 16 }}>
              Baza podstawowa
            </h2>
            <ul className="list">
              {basics.map((f) => (
                <li key={f.name}>
                  <button type="button" className="item" onClick={() => pickBasic(f)}>
                    <span className="item-main">
                      <span className="item-title">{f.name}</span>
                      <span className="item-sub">{formatWhole(f.per100.kcal)} kcal / 100 g · wartości średnie</span>
                    </span>
                    <span className="item-end">
                      <Icon name="plus" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {key.length >= 3 && (
          <div className="stack" style={{ marginTop: 16 }}>
            {onlineResult === null && (
              <button type="button" className="btn btn-block" onClick={() => void searchOnline()}>
                <Icon name="search" />
                Szukaj „{query.trim()}” w Open Food Facts
              </button>
            )}
            {onlineResult === 'searching' && <p className="note" role="status">Szukam w Open Food Facts…</p>}
            {(onlineResult === 'offline' || onlineResult === 'error') && (
              <p className="note error" role="status">
                {onlineResult === 'offline'
                  ? 'Brak połączenia z internetem.'
                  : 'Wyszukiwarka Open Food Facts teraz nie odpowiada. Spróbuj później albo zeskanuj kod kreskowy.'}
              </p>
            )}
            {Array.isArray(onlineResult) &&
              (onlineResult.length === 0 ? (
                <p className="empty">Open Food Facts nic nie znalazł. Zeskanuj kod kreskowy albo dodaj produkt z etykiety.</p>
              ) : (
                <>
                  <h2 className="label">Open Food Facts</h2>
                  <ul className="list">
                    {onlineResult.map((p, i) => (
                      <li key={`${p.barcode ?? ''}-${i}`}>
                        <button
                          type="button"
                          className="item"
                          onClick={() => {
                            const saved = p.barcode && store.products.find((x) => x.barcode === p.barcode);
                            if (saved) setPicked(saved);
                            else toForm({ draft: p, notice: 'Znaleziono w bazie Open Food Facts. Sprawdź wartości z etykietą i zapisz.' });
                          }}
                        >
                          <span className="item-main">
                            <span className="item-title">{p.name}</span>
                            <span className="item-sub">
                              {p.brand ? `${p.brand} · ` : ''}
                              {formatWhole(p.per100.kcal)} kcal / 100 g
                            </span>
                          </span>
                          <span className="item-end">
                            <Icon name="forward" />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ))}
          </div>
        )}
      </section>

      <Sheet open={scanning} onClose={() => setScanning(false)} title="Skanuj kod kreskowy">
        {scanning && <BarcodeScanner onCode={(code) => void onCode(code)} />}
      </Sheet>
      <Sheet open={picked !== null} onClose={() => setPicked(null)} title={picked?.name ?? ''}>
        {picked && (
          <AmountForm
            product={picked}
            submitLabel={`Dodaj do: ${MEAL_LABEL[meal].toLowerCase()}`}
            onSubmit={(grams) => {
              store.saveEntry({
                id: newId(),
                date,
                meal,
                productId: picked.id,
                name: picked.brand ? `${picked.name} (${picked.brand})` : picked.name,
                grams,
                per100: picked.per100,
                createdAt: new Date().toISOString(),
              });
              navigate(back);
            }}
          />
        )}
      </Sheet>
    </main>
  );
}
