# agtree

Иерархическая таблица на Vue 3 и AG Grid Enterprise. Дерево хранится в классе `TreeStore`.

Нужен Node.js `^20.19.0` или `>=22.12.0`.

## Команды

```bash
npm install
npm run dev
npm test
npm run benchmark
npm run build
```

`npm run dev` открывает таблицу. Данные читаются из `public/items.json` через `fetch` и не попадают в бандл. Перед появлением строк есть задержка 2 секунды и состояние загрузки.

## TreeStore

```ts
import { TreeStore } from './src/TreeStore'
```

Класс не зависит от Vue и AG Grid. `id` может быть числом или строкой.
