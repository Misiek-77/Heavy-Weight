/** How to perform a built-in exercise and which muscles it works. */
export interface ExerciseGuide {
  /** Muscles doing most of the work. */
  primary: string[];
  /** Muscles that assist or stabilise. */
  secondary: string[];
  steps: string[];
  mistakes: string[];
}

const g = (primary: string[], secondary: string[], steps: string[], mistakes: string[]): ExerciseGuide => ({
  primary,
  secondary,
  steps,
  mistakes,
});

/** Keyed by the built-in exercise id without its `seed-` prefix. */
const GUIDES: Record<string, ExerciseGuide> = {
  // ---------- klatka ----------
  'bench-press': g(
    ['klatka piersiowa'],
    ['przednie barki', 'triceps'],
    [
      'Połóż się tak, by oczy były pod sztangą. Ściągnij łopatki, stopy oprzyj mocno o podłogę.',
      'Chwyć sztangę nieco szerzej niż barki i zdejmij ją ze stojaków nad barki.',
      'Opuść sztangę na środek klatki, łokcie pod kątem około 45–70° do tułowia.',
      'Wyciśnij sztangę w górę i lekko w stronę stojaków, do wyprostu ramion.',
    ],
    ['Odbijanie sztangi od klatki.', 'Odrywanie pośladków od ławki.', 'Łokcie rozstawione pod kątem 90° do tułowia.'],
  ),
  'incline-bench-press': g(
    ['górna część klatki'],
    ['przednie barki', 'triceps'],
    [
      'Ustaw ławkę pod kątem 30–45°. Ściągnij łopatki i oprzyj stopy o podłogę.',
      'Chwyć sztangę nieco szerzej niż barki i zdejmij ją nad górną część klatki.',
      'Opuść sztangę do górnej części klatki, tuż pod obojczyki.',
      'Wyciśnij sztangę pionowo w górę do wyprostu ramion.',
    ],
    ['Zbyt stromy kąt ławki, który przenosi pracę na barki.', 'Opuszczanie sztangi w stronę szyi.', 'Odrywanie łopatek od oparcia.'],
  ),
  'db-bench-press': g(
    ['klatka piersiowa'],
    ['przednie barki', 'triceps'],
    [
      'Usiądź z hantlami na udach i połóż się, wnosząc je nad klatkę. Ściągnij łopatki.',
      'Opuść hantle po bokach klatki, aż łokcie znajdą się lekko poniżej ławki.',
      'Wyciśnij hantle w górę, zbliżając je do siebie nad klatką.',
    ],
    ['Zbyt płytki ruch.', 'Uderzanie hantlami o siebie w górze.', 'Nadgarstki odgięte do tyłu.'],
  ),
  'incline-db-press': g(
    ['górna część klatki'],
    ['przednie barki', 'triceps'],
    [
      'Ustaw ławkę pod kątem 30–45° i oprzyj plecy, hantle trzymaj przy barkach.',
      'Wyciśnij hantle w górę nad górną część klatki.',
      'Opuść je powoli do wysokości klatki, łokcie lekko poniżej barków.',
    ],
    ['Zbyt stromy kąt ławki.', 'Łokcie rozstawione szeroko na boki.', 'Skracanie ruchu w dole.'],
  ),
  'db-fly': g(
    ['klatka piersiowa'],
    ['przednie barki'],
    [
      'Połóż się na ławce z hantlami nad klatką, dłonie skierowane do siebie, łokcie lekko ugięte.',
      'Rozsuwaj ramiona szerokim łukiem, aż poczujesz rozciągnięcie klatki.',
      'Tym samym łukiem wróć do góry, napinając klatkę. Kąt w łokciach pozostaje stały.',
    ],
    ['Prostowanie i zginanie łokci, które zmienia ruch w wyciskanie.', 'Opuszczanie hantli zbyt nisko.', 'Zbyt duży ciężar.'],
  ),
  'cable-fly': g(
    ['klatka piersiowa'],
    ['przednie barki'],
    [
      'Stań pośrodku bramy, chwyć uchwyty górnych wyciągów i zrób krok w przód.',
      'Pochyl lekko tułów, łokcie lekko ugięte.',
      'Ściągnij uchwyty łukiem przed siebie, aż dłonie spotkają się na wysokości mostka.',
      'Wróć powoli do rozciągnięcia klatki.',
    ],
    ['Pchanie uchwytów jak przy wyciskaniu.', 'Kołysanie tułowiem.', 'Barki wysunięte do przodu.'],
  ),
  'pec-deck': g(
    ['klatka piersiowa'],
    ['przednie barki'],
    [
      'Ustaw siedzisko tak, by uchwyty były na wysokości klatki. Plecy przyklej do oparcia.',
      'Zbliż ramiona przed sobą, napinając klatkę.',
      'Wróć powoli do pozycji, w której czujesz rozciągnięcie.',
    ],
    ['Odrywanie pleców od oparcia.', 'Szarpanie ciężaru.', 'Zbyt głębokie cofanie ramion.'],
  ),
  'chest-press-machine': g(
    ['klatka piersiowa'],
    ['przednie barki', 'triceps'],
    [
      'Ustaw siedzisko tak, by uchwyty były na wysokości środka klatki.',
      'Ściągnij łopatki i wypchnij uchwyty przed siebie do prawie pełnego wyprostu.',
      'Wróć powoli, aż dłonie znajdą się przy klatce.',
    ],
    ['Odrywanie łopatek od oparcia.', 'Unoszenie łokci powyżej barków.', 'Blokowanie łokci z impetem.'],
  ),
  'push-up': g(
    ['klatka piersiowa'],
    ['triceps', 'przednie barki', 'brzuch'],
    [
      'Oprzyj dłonie nieco szerzej niż barki. Ciało w jednej linii od głowy do pięt.',
      'Opuść się, aż klatka znajdzie się tuż nad podłogą, łokcie około 45° od tułowia.',
      'Wypchnij się do wyprostu ramion, nie tracąc napięcia brzucha.',
    ],
    ['Opadające biodra.', 'Wypychanie pośladków w górę.', 'Zbyt płytki ruch.'],
  ),
  dip: g(
    ['klatka piersiowa', 'triceps'],
    ['przednie barki'],
    [
      'Podeprzyj się na poręczach na wyprostowanych ramionach, barki opuszczone.',
      'Pochyl lekko tułów i opuść się, aż ramiona będą równolegle do podłogi.',
      'Wypchnij się do wyprostu ramion.',
    ],
    ['Zbyt głębokie opuszczanie przy sztywnych barkach.', 'Unoszenie barków do uszu.', 'Bujanie nogami.'],
  ),

  // ---------- plecy ----------
  deadlift: g(
    ['pośladki', 'tył ud', 'prostowniki grzbietu'],
    ['czworoboczny', 'najszerszy grzbietu', 'przedramiona'],
    [
      'Stań ze stopami na szerokość bioder, sztanga nad środkiem stopy.',
      'Chwyć sztangę, wyprostuj plecy, napnij brzuch, barki nad sztangą.',
      'Odepchnij podłogę nogami i prowadź sztangę blisko nóg, aż staniesz prosto.',
      'Opuść sztangę, cofając biodra, z plecami w neutralnej pozycji.',
    ],
    ['Zaokrąglone plecy.', 'Sztanga oddalona od nóg.', 'Szarpanie sztangi z podłogi.', 'Przeprost w górze.'],
  ),
  'pull-up': g(
    ['najszerszy grzbietu'],
    ['biceps', 'środek pleców', 'przedramiona'],
    [
      'Chwyć drążek nachwytem nieco szerzej niż barki i zawiśnij na wyprostowanych ramionach.',
      'Ściągnij łopatki w dół i podciągnij się, prowadząc łokcie do bioder.',
      'Gdy broda minie drążek, opuść się powoli do pełnego wyprostu.',
    ],
    ['Bujanie ciałem i kopanie nogami.', 'Niepełny zakres ruchu.', 'Barki uniesione do uszu.'],
  ),
  'chin-up': g(
    ['najszerszy grzbietu', 'biceps'],
    ['środek pleców', 'przedramiona'],
    [
      'Chwyć drążek podchwytem na szerokość barków i zawiśnij na wyprostowanych ramionach.',
      'Ściągnij łopatki i podciągnij się, aż broda minie drążek.',
      'Opuść się powoli do pełnego wyprostu.',
    ],
    ['Skracanie ruchu w dole.', 'Bujanie ciałem.', 'Wysuwanie brody zamiast podciągania klatki.'],
  ),
  'barbell-row': g(
    ['środek pleców', 'najszerszy grzbietu'],
    ['tylne barki', 'biceps', 'prostowniki grzbietu'],
    [
      'Stań ze sztangą, ugnij lekko kolana i pochyl tułów z prostymi plecami.',
      'Przyciągnij sztangę do dolnej części brzucha, prowadząc łokcie blisko tułowia.',
      'Ściągnij łopatki w górze i opuść sztangę powoli.',
    ],
    ['Zaokrąglone plecy.', 'Podrywanie ciężaru tułowiem.', 'Zbyt pionowa pozycja tułowia.'],
  ),
  'db-row': g(
    ['najszerszy grzbietu', 'środek pleców'],
    ['biceps', 'tylne barki'],
    [
      'Oprzyj kolano i dłoń o ławkę, plecy proste i równoległe do podłogi.',
      'Przyciągnij hantlę do biodra, łokieć blisko tułowia.',
      'Opuść hantlę do pełnego wyprostu ramienia.',
    ],
    ['Skręcanie tułowia.', 'Ciągnięcie hantli do klatki zamiast do biodra.', 'Szarpanie ciężaru.'],
  ),
  'lat-pulldown': g(
    ['najszerszy grzbietu'],
    ['biceps', 'środek pleców'],
    [
      'Usiądź, zablokuj uda pod wałkami i chwyć drążek szeroko nachwytem.',
      'Odchyl lekko tułów i ściągnij drążek do górnej części klatki.',
      'Wróć powoli do wyprostu ramion.',
    ],
    ['Ściąganie drążka za kark.', 'Mocne odchylanie się do tyłu.', 'Ciągnięcie samymi rękami bez pracy łopatek.'],
  ),
  'seated-cable-row': g(
    ['środek pleców', 'najszerszy grzbietu'],
    ['biceps', 'tylne barki'],
    [
      'Usiądź z lekko ugiętymi kolanami i prostymi plecami, chwyć uchwyt.',
      'Przyciągnij uchwyt do brzucha, ściągając łopatki.',
      'Wróć powoli do wyprostu ramion, nie garbiąc się.',
    ],
    ['Bujanie tułowiem w przód i w tył.', 'Zaokrąglone plecy.', 'Unoszenie barków.'],
  ),
  't-bar-row': g(
    ['środek pleców', 'najszerszy grzbietu'],
    ['biceps', 'tylne barki', 'prostowniki grzbietu'],
    [
      'Stań okrakiem nad sztangą, pochyl tułów z prostymi plecami i chwyć uchwyt.',
      'Przyciągnij ciężar do klatki, łokcie blisko tułowia.',
      'Opuść powoli do wyprostu ramion.',
    ],
    ['Zaokrąglone plecy.', 'Prostowanie tułowia przy każdym powtórzeniu.', 'Zbyt duże talerze skracające ruch.'],
  ),
  'machine-row': g(
    ['środek pleców', 'najszerszy grzbietu'],
    ['biceps', 'tylne barki'],
    [
      'Ustaw siedzisko tak, by klatka opierała się o podpórkę, a uchwyty były na wysokości mostka.',
      'Przyciągnij uchwyty, ściągając łopatki.',
      'Wróć powoli do wyprostu ramion.',
    ],
    ['Odrywanie klatki od podpórki.', 'Unoszenie barków.', 'Skracanie ruchu.'],
  ),
  'straight-arm-pulldown': g(
    ['najszerszy grzbietu'],
    ['triceps', 'brzuch'],
    [
      'Stań przodem do wyciągu górnego, chwyć drążek prostymi rękami, tułów lekko pochylony.',
      'Ściągnij drążek łukiem do ud, nie zginając łokci.',
      'Wróć powoli do wysokości barków.',
    ],
    ['Zginanie łokci.', 'Bujanie tułowiem.', 'Zbyt duży ciężar.'],
  ),
  'back-extension': g(
    ['prostowniki grzbietu'],
    ['pośladki', 'tył ud'],
    [
      'Ustaw podpórkę tuż poniżej bioder, stopy zablokuj.',
      'Opuść tułów z prostymi plecami.',
      'Unieś tułów do linii prostej z nogami, napinając pośladki.',
    ],
    ['Przeprost w górze.', 'Zaokrąglanie pleców.', 'Szarpany ruch.'],
  ),
  shrug: g(
    ['czworoboczny (góra)'],
    ['przedramiona'],
    [
      'Stań prosto z hantlami po bokach.',
      'Unieś barki pionowo w stronę uszu.',
      'Zatrzymaj na chwilę i opuść powoli.',
    ],
    ['Krążenie barkami.', 'Zginanie łokci.', 'Wysuwanie głowy do przodu.'],
  ),

  // ---------- nogi ----------
  squat: g(
    ['czworogłowe uda', 'pośladki'],
    ['tył ud', 'prostowniki grzbietu', 'brzuch'],
    [
      'Oprzyj sztangę na górnej części pleców, stopy na szerokość barków, palce lekko na zewnątrz.',
      'Weź wdech, napnij brzuch i zejdź w dół, cofając biodra i uginając kolana.',
      'Zejdź co najmniej do równoległości ud z podłogą, kolana w linii stóp.',
      'Wstań, odpychając podłogę całymi stopami.',
    ],
    ['Kolana schodzące do środka.', 'Odrywanie pięt.', 'Zaokrąglanie pleców w dole.', 'Zbyt płytki przysiad.'],
  ),
  'front-squat': g(
    ['czworogłowe uda'],
    ['pośladki', 'brzuch', 'górna część pleców'],
    [
      'Oprzyj sztangę na przednich barkach, łokcie wysoko.',
      'Zejdź w dół z pionowym tułowiem, kolana w linii stóp.',
      'Wstań, utrzymując łokcie wysoko.',
    ],
    ['Opadające łokcie.', 'Pochylanie tułowia.', 'Odrywanie pięt.'],
  ),
  'leg-press': g(
    ['czworogłowe uda', 'pośladki'],
    ['tył ud'],
    [
      'Usiądź, oprzyj plecy i biodra, stopy na platformie na szerokość barków.',
      'Zwolnij blokadę i opuść platformę, aż kolana zegną się do około 90°.',
      'Wypchnij platformę, nie blokując kolan do końca.',
    ],
    ['Odrywanie bioder od siedziska.', 'Blokowanie kolan.', 'Kolana schodzące do środka.'],
  ),
  'romanian-deadlift': g(
    ['tył ud', 'pośladki'],
    ['prostowniki grzbietu', 'przedramiona'],
    [
      'Stań prosto ze sztangą przy udach, kolana lekko ugięte.',
      'Cofaj biodra i opuszczaj sztangę wzdłuż nóg z prostymi plecami.',
      'Gdy poczujesz mocne rozciągnięcie tyłu ud, wróć, wypychając biodra w przód.',
    ],
    ['Zaokrąglone plecy.', 'Uginanie kolan jak w przysiadzie.', 'Sztanga oddalona od nóg.'],
  ),
  lunge: g(
    ['czworogłowe uda', 'pośladki'],
    ['tył ud'],
    [
      'Stań prosto z hantlami po bokach.',
      'Zrób długi krok w przód i opuść się, aż oba kolana zegną się do około 90°.',
      'Odepchnij się przednią nogą i wróć do pozycji wyjściowej.',
    ],
    ['Zbyt krótki krok.', 'Kolano schodzące do środka.', 'Pochylanie tułowia.'],
  ),
  'bulgarian-split-squat': g(
    ['czworogłowe uda', 'pośladki'],
    ['tył ud'],
    [
      'Stań tyłem do ławki i oprzyj na niej grzbiet tylnej stopy.',
      'Opuść się, uginając przednią nogę, aż udo będzie równolegle do podłogi.',
      'Wstań, odpychając się piętą przedniej nogi.',
    ],
    ['Przednia stopa zbyt blisko ławki.', 'Kolano schodzące do środka.', 'Odbijanie się tylną nogą.'],
  ),
  'goblet-squat': g(
    ['czworogłowe uda', 'pośladki'],
    ['brzuch', 'górna część pleców'],
    [
      'Trzymaj hantlę pionowo przy klatce, łokcie blisko tułowia.',
      'Zejdź w dół między kolana z prostymi plecami.',
      'Wstań, odpychając podłogę całymi stopami.',
    ],
    ['Zaokrąglanie pleców.', 'Oddalanie hantli od klatki.', 'Odrywanie pięt.'],
  ),
  'hack-squat': g(
    ['czworogłowe uda'],
    ['pośladki'],
    [
      'Oprzyj plecy i barki o maszynę, stopy na platformie na szerokość barków.',
      'Zwolnij blokadę i zejdź, aż uda będą co najmniej równolegle do platformy.',
      'Wypchnij się w górę, nie blokując kolan.',
    ],
    ['Odrywanie pięt.', 'Kolana schodzące do środka.', 'Odrywanie dolnych pleców od oparcia.'],
  ),
  'leg-extension': g(
    ['czworogłowe uda'],
    [],
    [
      'Ustaw oparcie tak, by kolana były w osi obrotu maszyny, a wałek nad kostkami.',
      'Wyprostuj nogi do pełnego wyprostu i zatrzymaj na chwilę.',
      'Opuść powoli.',
    ],
    ['Wymachiwanie ciężarem.', 'Odrywanie bioder od siedziska.', 'Opuszczanie bez kontroli.'],
  ),
  'leg-curl': g(
    ['tył ud'],
    ['łydki'],
    [
      'Połóż się tak, by kolana były w osi obrotu maszyny, a wałek nad piętami.',
      'Ugnij nogi, przyciągając wałek do pośladków.',
      'Opuść powoli do prawie pełnego wyprostu.',
    ],
    ['Unoszenie bioder.', 'Szarpanie ciężaru.', 'Skracanie ruchu.'],
  ),
  'hip-thrust': g(
    ['pośladki'],
    ['tył ud'],
    [
      'Oprzyj łopatki o ławkę, sztanga na biodrach, stopy na szerokość bioder.',
      'Wypchnij biodra w górę, aż tułów będzie równolegle do podłogi.',
      'Napnij pośladki w górze i opuść biodra powoli.',
    ],
    ['Przeprost w odcinku lędźwiowym.', 'Stopy zbyt blisko lub zbyt daleko.', 'Odchylanie głowy do tyłu.'],
  ),
  'standing-calf-raise': g(
    ['łydki'],
    [],
    [
      'Stań przednią częścią stóp na podwyższeniu, kolana prawie proste.',
      'Wspnij się na palce jak najwyżej i zatrzymaj na chwilę.',
      'Opuść pięty poniżej poziomu podwyższenia.',
    ],
    ['Sprężynowanie.', 'Zbyt krótki zakres ruchu.', 'Uginanie kolan.'],
  ),
  'seated-calf-raise': g(
    ['łydki (płaszczkowaty)'],
    [],
    [
      'Usiądź, wałek oprzyj nad kolanami, przednia część stóp na podwyższeniu.',
      'Wspnij się na palce i zatrzymaj na chwilę.',
      'Opuść pięty powoli jak najniżej.',
    ],
    ['Sprężynowanie.', 'Zbyt krótki zakres ruchu.', 'Pomaganie rękami.'],
  ),

  // ---------- barki ----------
  'overhead-press': g(
    ['barki'],
    ['triceps', 'górna część klatki', 'brzuch'],
    [
      'Stań prosto, sztanga na obojczykach, chwyt nieco szerzej niż barki, łokcie lekko przed sztangą.',
      'Napnij brzuch i pośladki, wyciśnij sztangę pionowo nad głowę.',
      'Gdy sztanga minie czoło, wsuń głowę pod nią i wyprostuj ramiona.',
      'Opuść sztangę powoli na obojczyki.',
    ],
    ['Odchylanie się do tyłu.', 'Wybijanie ciężaru nogami.', 'Sztanga prowadzona przed ciałem zamiast nad nim.'],
  ),
  'db-shoulder-press': g(
    ['barki'],
    ['triceps'],
    [
      'Usiądź z oparciem, hantle na wysokości uszu, łokcie pod nadgarstkami.',
      'Wyciśnij hantle nad głowę do prawie pełnego wyprostu.',
      'Opuść powoli do wysokości uszu.',
    ],
    ['Odrywanie pleców od oparcia.', 'Opuszczanie zbyt płytko.', 'Uderzanie hantlami w górze.'],
  ),
  'arnold-press': g(
    ['barki'],
    ['triceps'],
    [
      'Usiądź, hantle przed barkami, dłonie skierowane do siebie.',
      'Wyciskając, obracaj dłonie na zewnątrz, aż w górze będą skierowane w przód.',
      'Opuść, odwracając ruch.',
    ],
    ['Zbyt szybki obrót.', 'Odchylanie tułowia.', 'Skracanie ruchu.'],
  ),
  'lateral-raise': g(
    ['boczne barki'],
    ['czworoboczny'],
    [
      'Stań prosto z hantlami po bokach, łokcie lekko ugięte.',
      'Unieś ramiona bokiem do wysokości barków, łokcie prowadzą ruch.',
      'Opuść powoli.',
    ],
    ['Wymachiwanie tułowiem.', 'Unoszenie powyżej barków.', 'Dłonie wyżej niż łokcie.', 'Zbyt duży ciężar.'],
  ),
  'cable-lateral-raise': g(
    ['boczne barki'],
    ['czworoboczny'],
    [
      'Stań bokiem do wyciągu dolnego i chwyć uchwyt dalszą ręką.',
      'Unieś ramię bokiem do wysokości barku.',
      'Opuść powoli, utrzymując napięcie linki.',
    ],
    ['Bujanie tułowiem.', 'Zginanie łokcia podczas unoszenia.', 'Unoszenie barku do ucha.'],
  ),
  'front-raise': g(
    ['przednie barki'],
    ['górna część klatki'],
    [
      'Stań prosto z hantlami przed udami.',
      'Unieś ramiona przed siebie do wysokości barków.',
      'Opuść powoli.',
    ],
    ['Bujanie tułowiem.', 'Unoszenie powyżej barków.', 'Zbyt duży ciężar.'],
  ),
  'rear-delt-fly': g(
    ['tylne barki'],
    ['środek pleców', 'czworoboczny'],
    [
      'Pochyl tułów prawie równolegle do podłogi, hantle pod klatką, łokcie lekko ugięte.',
      'Rozsuń ramiona na boki do wysokości barków.',
      'Opuść powoli.',
    ],
    ['Prostowanie tułowia.', 'Mocne ściąganie łopatek zamiast pracy barków.', 'Szarpanie ciężaru.'],
  ),
  'face-pull': g(
    ['tylne barki'],
    ['środek pleców', 'rotatory barku'],
    [
      'Ustaw wyciąg na wysokości twarzy i chwyć linę nachwytem.',
      'Przyciągnij linę do twarzy, rozchylając jej końce, łokcie wysoko.',
      'Wróć powoli do wyprostu ramion.',
    ],
    ['Odchylanie tułowia.', 'Opadające łokcie.', 'Zbyt duży ciężar.'],
  ),
  'upright-row': g(
    ['barki', 'czworoboczny'],
    ['biceps'],
    [
      'Stań prosto ze sztangą przy udach, chwyt na szerokość barków.',
      'Unieś sztangę wzdłuż tułowia do wysokości dolnej części klatki, łokcie prowadzą ruch.',
      'Opuść powoli.',
    ],
    ['Zbyt wąski chwyt.', 'Unoszenie łokci wysoko ponad barki.', 'Bujanie tułowiem.'],
  ),

  // ---------- biceps ----------
  'barbell-curl': g(
    ['biceps'],
    ['przedramiona'],
    [
      'Stań prosto, sztanga podchwytem na szerokość barków, łokcie przy tułowiu.',
      'Ugnij ramiona, unosząc sztangę do barków.',
      'Opuść powoli do pełnego wyprostu.',
    ],
    ['Bujanie tułowiem.', 'Wysuwanie łokci do przodu.', 'Skracanie ruchu w dole.'],
  ),
  'db-curl': g(
    ['biceps'],
    ['przedramiona'],
    [
      'Stań prosto z hantlami po bokach, dłonie skierowane do ud.',
      'Uginając ramię, obróć dłoń do góry i unieś hantlę do barku.',
      'Opuść powoli, odwracając dłoń.',
    ],
    ['Bujanie tułowiem.', 'Odrywanie łokci od tułowia.', 'Opuszczanie bez kontroli.'],
  ),
  'hammer-curl': g(
    ['biceps', 'ramienno-promieniowy'],
    ['przedramiona'],
    [
      'Stań z hantlami po bokach, dłonie skierowane do siebie.',
      'Ugnij ramiona bez obracania dłoni.',
      'Opuść powoli.',
    ],
    ['Bujanie tułowiem.', 'Wysuwanie łokci do przodu.', 'Zbyt duży ciężar.'],
  ),
  'preacher-curl': g(
    ['biceps'],
    ['przedramiona'],
    [
      'Usiądź, ramiona oprzyj całą długością o podpórkę.',
      'Ugnij ramiona, unosząc sztangę.',
      'Opuść powoli do prawie pełnego wyprostu.',
    ],
    ['Odrywanie ramion od podpórki.', 'Gwałtowny wyprost w dole.', 'Skracanie ruchu.'],
  ),
  'cable-curl': g(
    ['biceps'],
    ['przedramiona'],
    [
      'Stań przodem do wyciągu dolnego, chwyć drążek podchwytem, łokcie przy tułowiu.',
      'Ugnij ramiona.',
      'Opuść powoli, utrzymując napięcie linki.',
    ],
    ['Odchylanie się do tyłu.', 'Wysuwanie łokci.', 'Szarpanie ciężaru.'],
  ),
  'incline-db-curl': g(
    ['biceps'],
    ['przedramiona'],
    [
      'Usiądź na ławce ustawionej pod kątem 45–60°, ramiona zwisają swobodnie.',
      'Ugnij ramiona, nie przesuwając łokci do przodu.',
      'Opuść powoli do pełnego wyprostu.',
    ],
    ['Wysuwanie łokci.', 'Odrywanie barków od oparcia.', 'Zbyt duży ciężar.'],
  ),

  // ---------- triceps ----------
  'triceps-pushdown': g(
    ['triceps'],
    [],
    [
      'Stań przodem do wyciągu górnego, łokcie przy tułowiu, tułów lekko pochylony.',
      'Wyprostuj ramiona w dół do pełnego wyprostu.',
      'Wróć powoli, aż przedramiona znajdą się nieco powyżej poziomu.',
    ],
    ['Odrywanie łokci od tułowia.', 'Pomaganie barkami i tułowiem.', 'Skracanie ruchu.'],
  ),
  'skull-crusher': g(
    ['triceps'],
    [],
    [
      'Połóż się na ławce ze sztangą nad klatką, ramiona wyprostowane.',
      'Zegnij łokcie i opuść sztangę w stronę czoła lub tuż za głowę. Ramiona pozostają nieruchome.',
      'Wyprostuj ramiona.',
    ],
    ['Rozchodzenie się łokci na boki.', 'Poruszanie ramionami zamiast przedramionami.', 'Zbyt duży ciężar.'],
  ),
  'overhead-triceps-extension': g(
    ['triceps'],
    [],
    [
      'Usiądź lub stań, hantlę trzymaj oburącz nad głową.',
      'Opuść hantlę za głowę, łokcie skierowane w górę.',
      'Wyprostuj ramiona.',
    ],
    ['Rozchodzenie się łokci.', 'Wyginanie odcinka lędźwiowego.', 'Skracanie ruchu.'],
  ),
  'close-grip-bench-press': g(
    ['triceps'],
    ['klatka piersiowa', 'przednie barki'],
    [
      'Połóż się jak do wyciskania, chwyt na szerokość barków.',
      'Opuść sztangę na dolną część klatki, łokcie blisko tułowia.',
      'Wyciśnij sztangę do wyprostu ramion.',
    ],
    ['Zbyt wąski chwyt obciążający nadgarstki.', 'Łokcie rozstawione na boki.', 'Odbijanie sztangi od klatki.'],
  ),
  'bench-dip': g(
    ['triceps'],
    ['przednie barki', 'klatka piersiowa'],
    [
      'Oprzyj dłonie o krawędź ławki za plecami, nogi wysunięte w przód.',
      'Opuść biodra, uginając łokcie do około 90°.',
      'Wypchnij się do wyprostu ramion.',
    ],
    ['Zbyt głębokie opuszczanie.', 'Biodra oddalone od ławki.', 'Barki uniesione do uszu.'],
  ),
  'rope-overhead-extension': g(
    ['triceps'],
    [],
    [
      'Stań tyłem do wyciągu, lina za głową, tułów pochylony, jedna noga z przodu.',
      'Wyprostuj ramiona przed siebie i w górę.',
      'Wróć powoli za głowę.',
    ],
    ['Poruszanie ramionami.', 'Rozchodzenie się łokci.', 'Wyginanie pleców.'],
  ),

  // ---------- brzuch ----------
  plank: g(
    ['brzuch'],
    ['skośne brzucha', 'pośladki', 'barki'],
    [
      'Oprzyj się na przedramionach i palcach stóp, łokcie pod barkami.',
      'Ustaw ciało w jednej linii, napnij brzuch i pośladki.',
      'Utrzymaj pozycję, oddychając spokojnie. W polu powtórzeń wpisz czas w sekundach.',
    ],
    ['Opadające biodra.', 'Wypychanie pośladków w górę.', 'Wstrzymywanie oddechu.'],
  ),
  crunch: g(
    ['brzuch'],
    [],
    [
      'Połóż się na plecach, kolana ugięte, dłonie przy skroniach.',
      'Unieś łopatki, zbliżając żebra do miednicy.',
      'Opuść powoli, nie kładąc głowy na podłodze.',
    ],
    ['Ciągnięcie głowy rękami.', 'Odrywanie dolnych pleców od podłogi.', 'Szarpanie.'],
  ),
  'hanging-leg-raise': g(
    ['brzuch', 'zginacze bioder'],
    ['przedramiona'],
    [
      'Zawiśnij na drążku, barki aktywne.',
      'Unieś nogi do poziomu lub wyżej, podwijając miednicę.',
      'Opuść powoli bez bujania.',
    ],
    ['Bujanie ciałem.', 'Unoszenie nóg bez podwijania miednicy.', 'Opuszczanie bez kontroli.'],
  ),
  'cable-crunch': g(
    ['brzuch'],
    [],
    [
      'Uklęknij przodem do wyciągu górnego, linę trzymaj przy głowie.',
      'Zwiń tułów, zbliżając łokcie do kolan. Biodra pozostają nieruchome.',
      'Wróć powoli.',
    ],
    ['Ciągnięcie rękami.', 'Siadanie na piętach przy każdym powtórzeniu.', 'Proste plecy zamiast zwijania tułowia.'],
  ),
  'russian-twist': g(
    ['skośne brzucha'],
    ['brzuch'],
    [
      'Usiądź, odchyl tułów z prostymi plecami, stopy na podłodze lub lekko nad nią.',
      'Skręć tułów w jedną stronę, przenosząc dłonie lub ciężar obok biodra.',
      'Skręć w drugą stronę. Ruch wychodzi z tułowia, nie z rąk.',
    ],
    ['Zaokrąglone plecy.', 'Poruszanie samymi rękami.', 'Zbyt szybkie tempo.'],
  ),
  'ab-wheel': g(
    ['brzuch'],
    ['najszerszy grzbietu', 'barki'],
    [
      'Uklęknij z kółkiem pod barkami, brzuch napięty, plecy lekko zaokrąglone.',
      'Wytocz kółko w przód tak daleko, jak utrzymasz napięcie brzucha.',
      'Wróć, przyciągając kółko pracą brzucha.',
    ],
    ['Opadające biodra i wygięte lędźwie.', 'Wracanie pracą bioder.', 'Zbyt daleki wytok.'],
  ),

  // ---------- inne ----------
  'farmer-walk': g(
    ['przedramiona', 'czworoboczny'],
    ['brzuch', 'pośladki', 'łydki'],
    [
      'Podnieś ciężary z podłogi z prostymi plecami.',
      'Stań prosto, barki cofnięte, brzuch napięty.',
      'Idź krótkimi, równymi krokami. W polu powtórzeń wpisz dystans lub czas.',
    ],
    ['Garbienie się.', 'Przechylanie tułowia na boki.', 'Zbyt długie kroki.'],
  ),
  'kettlebell-swing': g(
    ['pośladki', 'tył ud'],
    ['prostowniki grzbietu', 'brzuch', 'barki'],
    [
      'Stań szerzej niż biodra, kettlebell przed stopami.',
      'Zamachnij kettlebell między nogi, cofając biodra z prostymi plecami.',
      'Wypchnij dynamicznie biodra w przód, pozwalając kettlebell unieść się do wysokości klatki.',
      'Pozwól mu opaść i ponownie cofnij biodra.',
    ],
    ['Przysiad zamiast zawiasu w biodrach.', 'Unoszenie ciężaru rękami.', 'Zaokrąglone plecy.', 'Przeprost w górze.'],
  ),
};

/** Guide for a built-in exercise, or undefined for custom ones. */
export function guideFor(exerciseId: string): ExerciseGuide | undefined {
  return exerciseId.startsWith('seed-') ? GUIDES[exerciseId.slice('seed-'.length)] : undefined;
}
