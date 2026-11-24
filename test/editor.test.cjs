const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

// The host loads the plugin through its browser module loader. Capture the
// private functions in this test rather than exposing a production debug API.
const client = fs.readFileSync(path.join(__dirname, '..', 'client.js'), 'utf8');
const anchor = "    return {\n      inject: ['slots'],";
assert.ok(client.includes(anchor), 'plugin factory return was not found');
const instrumented = client.replace(anchor,
  '    window.__test = { CATEGORIES, AXMATH_ROOTS, AXMATH_OPERATORS, AXMATH_SPECIAL, AXMATH_SMALL_ACCENTS, AXMATH_WIDE_ACCENTS, AXMATH_INTEGRALS, AXMATH_BIGOPS, AXMATH_MATRICES, AXMATH_ARROWS, CSS, matrixTemplate, MatrixIcon, RootSpecialIcon, CellButton, Launcher, Panel, VisualEditor, parseLatex, parseVisual, renderMath, renderVisualDoc, compatibleLatex, insertIntoSnippet, visualInsertText, visualInsertItem, visualApplySlant, visualApplyScriptKey, visualDeleteBackward, visualDeleteForward, visualMoveHorizontal, visualMoveVertical, visualMoveTab, visualExecuteCommand, visualProcessInput, offsetToVisualCursor, store };\n' + anchor);
const React = {
  Fragment: Symbol('fragment'),
  Component: class {},
  createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
  useReducer: (_reducer, initial) => [initial, () => {}],
  useEffect: () => {},
  useState: (initial) => [initial, () => {}],
  useRef: (initial) => ({ current: initial }),
  useMemo: (callback) => callback(),
};
let definition;
const window = { __ModuleLoader__: { load: (value) => { definition = value; } } };
vm.runInNewContext(instrumented, { window, requestAnimationFrame: (callback) => callback(),
  setTimeout: () => 0, clearTimeout: () => {} });
definition.factory(() => React);
const editor = window.__test;

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function findClass(node, className) {
  if (!node || typeof node !== 'object') return null;
  if ((node.props?.className || '').split(' ').includes(className)) return node;
  for (const child of node.children || []) {
    for (const item of Array.isArray(child) ? child : [child]) {
      const result = findClass(item, className);
      if (result) return result;
    }
  }
  return null;
}

function countType(node, type) {
  if (Array.isArray(node)) return node.reduce((total, item) => total + countType(item, type), 0);
  if (!node || typeof node !== 'object') return 0;
  return (node.type === type ? 1 : 0) + countType(node.children || [], type);
}

function countClass(node, className) {
  if (Array.isArray(node)) return node.reduce((total, item) => total + countClass(item, className), 0);
  if (!node || typeof node !== 'object') return 0;
  const matches = (node.props?.className || '').split(' ').includes(className);
  return (matches ? 1 : 0) + countClass(node.children || [], className);
}

test('categories follow the eleven local AxMath palette groups', () => {
  assert.deepEqual(Array.from(editor.CATEGORIES, (category) => category.id), [
    'greek', 'radical', 'binary', 'special', 'smallaccent', 'accent', 'bracket', 'integral', 'bigops', 'matrix', 'arrow',
  ]);
});

test('only the agreed non-symbol and non-standard-graphic entries are omitted', () => {
  const missing = (items) => Array.from(items, (item, index) => item === null ? index : -1).filter((index) => index !== -1);
  assert.deepEqual(missing(editor.AXMATH_ROOTS), [26]);
  assert.deepEqual(missing(editor.AXMATH_SPECIAL), [261, 262, 266]);
  assert.deepEqual(missing(editor.AXMATH_WIDE_ACCENTS), [34, 35]);
  for (const items of [editor.AXMATH_OPERATORS, editor.AXMATH_SMALL_ACCENTS,
    editor.AXMATH_INTEGRALS, editor.AXMATH_BIGOPS, editor.AXMATH_MATRICES, editor.AXMATH_ARROWS]) {
    assert.deepEqual(missing(items), []);
  }
  assert.equal(editor.CATEGORIES.reduce((sum, category) => sum + category.items.length, 0), 462);
  assert.equal(editor.CATEGORIES.reduce((sum, category) => sum + (category.expandedItems || category.items).length, 0), 1026);
});

test('Greek palette follows the four rows of the local AxMath panel', () => {
  const greek = editor.CATEGORIES.find((category) => category.id === 'greek');
  assert.deepEqual(Array.from(greek.items, (item) => item.name), [
    'alpha', 'beta', 'chi', 'delta', 'epsilon', 'varepsilon', 'phi', 'varphi', 'gamma', 'eta',
    'iota', 'kappa', 'lambda', 'mu', 'nu', 'pi', 'varpi', 'theta', 'vartheta', 'rho',
    'varrho', 'sigma', 'varsigma', 'tau', 'upsilon', 'omega', 'xi', 'psi', 'zeta', 'varDelta',
    'varPhi', 'varGamma', 'varLambda', 'varPi', 'varTheta', 'varSigma', 'varOmega', 'varXi', 'varPsi', 'varUpsilon',
  ]);
  assert.deepEqual(plain(editor.parseLatex('\\Gamma')), [{ type: 'sym', ch: 'Γ' }]);
});

test('operator palette uses the verified AxMath positions', () => {
  const operators = editor.CATEGORIES.find((category) => category.id === 'binary');
  assert.equal(editor.AXMATH_OPERATORS.length, 239);
  assert.equal(operators.expandedItems.length, 239);
  assert.equal(operators.items.length, 71);
  assert.deepEqual(Array.from(operators.items.slice(0, 10), (item) => item.latex), [
    '+', '\\pm', '\\approx', '>', '\\gg', '\\forall', '\\succ', '\\oplus', '\\circledast', '\\cup',
  ]);
  assert.equal(editor.AXMATH_OPERATORS[41].latex, '\\notin');
  assert.equal(editor.AXMATH_OPERATORS[42].latex, '\\owns');
  assert.equal(editor.AXMATH_OPERATORS[62].ch, '∿');
  assert.equal(editor.AXMATH_OPERATORS[63].latex, '\\mathrel{\\overset{\\text{∿}}{=}}');
});

test('identified root and script templates follow AxMath positions', () => {
  assert.equal(editor.AXMATH_ROOTS.length, 27);
  assert.equal(editor.AXMATH_ROOTS.filter(Boolean).length, 26);
  assert.equal(editor.AXMATH_ROOTS[0].latex, '\\sqrt{@}');
  assert.equal(editor.AXMATH_ROOTS[2].latex, '^{@}');
  assert.equal(editor.AXMATH_ROOTS[9].latex, '\\sqrt[@]{}');
  assert.equal(editor.AXMATH_ROOTS[10].latex, '{@}/{}');
  assert.equal(editor.AXMATH_ROOTS[18].latex, '{}\\overset{@}{\\overline{){}}}');
  assert.ok(findClass(editor.renderMath('2\\overset{3}{\\overline{)6}}'), 'dme-stack'));
  assert.equal(editor.AXMATH_ROOTS[21].latex, '\\underset{@}{}');
  assert.equal(editor.AXMATH_ROOTS[23].latex, '\\phantom{@}');
  assert.equal(editor.AXMATH_ROOTS[26], null);
  assert.equal(editor.AXMATH_ROOTS[15].latex, '\\quad');
});

test('identified special characters retain their AxMath IDs', () => {
  const special = editor.CATEGORIES.find((category) => category.id === 'special');
  assert.equal(editor.AXMATH_SPECIAL.length, 267);
  assert.equal(special.items.length, 62);
  assert.equal(special.expandedItems.length, 264);
  assert.equal(editor.AXMATH_SPECIAL[0].ch, '°');
  assert.equal(editor.AXMATH_SPECIAL[1].latex, '\\partial');
  assert.equal(editor.AXMATH_SPECIAL[35].latex, '\\mathbb{A}');
  assert.equal(editor.AXMATH_SPECIAL[51].latex, '\\mathbb{Q}');
  assert.equal(editor.AXMATH_SPECIAL[30].latex, '\\eth');
  assert.equal(editor.AXMATH_SPECIAL[195].ch, '∋');
  assert.equal(editor.AXMATH_SPECIAL[261], null);
  assert.equal(editor.AXMATH_SPECIAL[262], null);
});

test('identified arrows retain their AxMath positions', () => {
  const arrows = editor.CATEGORIES.find((category) => category.id === 'arrow');
  assert.equal(editor.AXMATH_ARROWS.length, 184);
  assert.equal(arrows.items.length, 63);
  assert.equal(arrows.expandedItems.length, 184);
  assert.deepEqual(Array.from(arrows.items.slice(0, 4), (item) => item.ch), ['←', '↑', '→', '↓']);
  assert.equal(editor.AXMATH_ARROWS[163].latex, '\\xrightarrow{@}');
  assert.equal(editor.AXMATH_ARROWS[87].latex, '\\overset{\\nearrow}{\\nearrow}');
  assert.equal(editor.AXMATH_ARROWS[95].latex, '\\mathrel{\\begin{array}{r}\\rightharpoonup \\\\ \\xleftharpoondown{}\\end{array}}');
  assert.equal(editor.AXMATH_ARROWS[143].latex, '\\rightleftharpoons');
  assert.equal(editor.AXMATH_ARROWS[141].ch, '⥂');
  assert.equal(editor.AXMATH_ARROWS[142].ch, '⥄');
  assert.equal(editor.AXMATH_ARROWS[166].latex, '\\xrightleftarrows{@}');
  assert.equal(editor.AXMATH_ARROWS[169].latex, '\\xrightleftharpoons{@}');
  assert.equal(editor.AXMATH_ARROWS[180].latex, '\\xrightleftharpoons[@]{}');
  assert.equal(new Set(Array.from(editor.AXMATH_ARROWS.slice(166, 172), (item) => item.latex)).size, 6);
  assert.equal(new Set(Array.from(editor.AXMATH_ARROWS.slice(177, 183), (item) => item.latex)).size, 6);
  assert.equal(editor.parseLatex('\\xrightleftarrows{a}')[0].ch, '⇄');
  assert.equal(editor.parseLatex('\\xrightleftharpoons{a}')[0].ch, '⇌');
  assert.equal(countType(editor.renderMath(editor.AXMATH_ARROWS[181].preview), 'tr'), 2);
  assert.equal(editor.AXMATH_ARROWS[172].latex, '\\xRightarrow{@}');
  const labelled = editor.parseLatex('\\xleftrightarrow[a]{b}')[0];
  assert.equal(labelled.type, 'xarrow');
  assert.equal(labelled.below[0].v, 'a');
  assert.equal(labelled.above[0].v, 'b');
});

test('identified above and below accents retain their palette positions', () => {
  assert.equal(editor.AXMATH_SMALL_ACCENTS.length, 44);
  assert.equal(editor.AXMATH_SMALL_ACCENTS.filter(Boolean).length, 44);
  assert.equal(editor.AXMATH_SMALL_ACCENTS[0].latex, '\\dot{@}');
  assert.equal(editor.AXMATH_SMALL_ACCENTS[22].latex, '\\underset{\\cdot}{@}');
  assert.equal(editor.AXMATH_WIDE_ACCENTS.length, 48);
  assert.equal(editor.AXMATH_WIDE_ACCENTS.filter(Boolean).length, 46);
  assert.equal(editor.AXMATH_WIDE_ACCENTS[12].latex, '\\undergroup{@}');
  assert.equal(editor.AXMATH_WIDE_ACCENTS[25].latex, '\\bcancel{@}');
  assert.equal(editor.AXMATH_WIDE_ACCENTS[34], null);
  assert.equal(editor.AXMATH_WIDE_ACCENTS[35], null);
});

test('integral and large-operator templates use AxMath palette ordering', () => {
  const integral = editor.CATEGORIES.find((category) => category.id === 'integral');
  const bigop = editor.CATEGORIES.find((category) => category.id === 'bigops');
  assert.equal(editor.AXMATH_INTEGRALS.length, 50);
  assert.equal(integral.items.length, 20);
  assert.equal(integral.expandedItems.length, 50);
  assert.equal(integral.items[0].latex, '\\int{@}');
  assert.equal(integral.items[10].latex, '\\int_{@}{}');
  assert.equal(integral.items[19].latex, '\\int_{@}^{}{}');
  assert.equal(editor.AXMATH_INTEGRALS[30].latex, '\\int\\limits_{@}{}');
  assert.equal(editor.AXMATH_INTEGRALS[40].latex, '\\int\\limits_{@}^{}{}');
  assert.equal(editor.AXMATH_INTEGRALS[22].latex, '\\ointctrclockwise_{@}^{}{}');
  assert.equal(editor.AXMATH_INTEGRALS[23].latex, '\\ointclockwise_{@}^{}{}');
  assert.equal(editor.AXMATH_INTEGRALS[32].latex, '\\ointctrclockwise\\limits_{@}{}');
  assert.equal(editor.parseLatex('\\int\\limits_{0}^{1}')[0].limits, 'stack');
  assert.equal(editor.AXMATH_BIGOPS.length, 49);
  assert.equal(bigop.items.length, 29);
  assert.equal(bigop.expandedItems.length, 49);
  assert.equal(bigop.items[0].latex, '\\sum{@}');
  assert.equal(bigop.items[12].latex, '\\sum\\limits_{@}^{}{}');
  assert.equal(bigop.items[24].latex, '\\sum\\limits_{@}{}');
  assert.equal(editor.AXMATH_BIGOPS[36].latex, '\\sum\\nolimits_{@}^{}{}');
  assert.equal(editor.AXMATH_BIGOPS[48].latex, '{}_{}^{}\\mathop{@}\\nolimits_{}^{}');
  assert.equal(editor.parseLatex('\\sum\\nolimits_{i}^{n}')[0].limits, 'side');
  const generic = editor.parseLatex('\\mathop{\\sum}\\nolimits_{i}^{n}')[0];
  assert.equal(generic.type, 'mathop');
  assert.equal(generic.kids[0].type, 'bigop');
  assert.equal(generic.limits, 'side');
});

test('delimiter palette includes paired, one-sided and divided templates', () => {
  const items = editor.CATEGORIES.find((category) => category.id === 'bracket').items;
  assert.equal(items.length, 32);
  assert.equal(items[0].latex, '\\left(@\\right)');
  assert.equal(items[16].latex, '\\left(@\\right.');
  assert.equal(items[17].latex, '\\left.@\\right)');
  assert.equal(items[30].latex, '\\left[@\\mid{}\\right]');
});

test('preview attaches subscripts and superscripts to their base', () => {
  assert.deepEqual(plain(editor.parseLatex('x_{i}^{2}')), [{
    type: 'script', base: { type: 'text', v: 'x' },
    sub: [{ type: 'text', v: 'i' }], sup: [{ type: 'text', v: '2' }],
  }]);
  const integral = editor.parseLatex('\\int_0^1')[0];
  assert.equal(integral.type, 'integral');
  assert.equal(integral.sub[0].v, '0');
  assert.equal(integral.sup[0].v, '1');
});

test('preview keeps supplementary Unicode characters whole', () => {
  assert.deepEqual(plain(editor.parseLatex('𝔸x')), [
    { type: 'text', v: '𝔸' }, { type: 'text', v: 'x' },
  ]);
  assert.equal(editor.parseLatex('\\mathbb{ABC}')[0].v, '𝔸𝔹ℂ');
  assert.equal(editor.parseLatex('\\mathfrak{az}')[0].v, '𝔞𝔷');
  const cell = editor.CellButton({ item: { kind: 'symbol', ch: '𝔸', latex: '\\mathbb{A}' }, text: { insert: 'insert' } });
  assert.equal(cell.children[0].props.className, 'dme-cell-glyph');
});

test('under annotations are rendered below their base', () => {
  assert.ok(findClass(editor.renderMath('\\underset{a}{b}'), 'dme-stack-under'));
  assert.ok(findClass(editor.renderMath('\\underleftarrow{x}'), 'dme-accent-below'));
  assert.equal(findClass(editor.renderMath('\\overset{a}{b}'), 'dme-stack-under'), null);
});

test('matrix templates start empty and keep their empty rows', () => {
  const matrix = editor.CATEGORIES.find((category) => category.id === 'matrix');
  assert.equal(matrix.items.length, 52);
  const twoByTwo = matrix.items.find((item) => item.name === '2×2 parentheses');
  assert.equal(twoByTwo.latex, '\\begin{pmatrix} @ & {} \\\\ {} & {} \\end{pmatrix}');
  assert.equal(countClass(editor.renderMath(twoByTwo.preview), 'dme-placeholder'), 4);
  const icon = editor.MatrixIcon(twoByTwo.matrixPreview);
  assert.equal(countType(icon, 'rect'), 4);
  assert.equal(countType(icon, 'path'), 2);
  const fourByFour = matrix.items.find((item) => item.name === '4×4 determinant');
  assert.equal(countType(editor.MatrixIcon(fourByFour.matrixPreview), 'rect'), 16);
  const source = '\\begin{matrix}a&\\\\&\\end{matrix}';
  assert.equal(countType(editor.renderMath(source), 'tr'), 2);
  assert.equal(countType(editor.renderMath(source), 'td'), 4);
  const configured = editor.matrixTemplate('pmatrix', 2, 3, 'test', 'r');
  assert.ok(configured.latex.startsWith('\\left(\\begin{array}{rrr}'));
  assert.equal(countType(editor.renderMath(configured.latex.replace('@', 'x')), 'td'), 6);
  const custom = editor.AXMATH_MATRICES[43];
  assert.equal(custom.kind, 'matrixCustom');
  assert.equal(custom.rowInput, true);
  assert.equal(custom.columnInput, true);
});

test('all template caret markers are removed while the first sets the caret', () => {
  let selection;
  editor.store.textarea = {
    selectionStart: 1, selectionEnd: 1,
    focus() {}, setSelectionRange(start, end) { selection = [start, end]; },
  };
  editor.store.latex = 'xy';
  editor.insertIntoSnippet({ kind: 'template', latex: '\\frac{@}{@}' });
  assert.equal(editor.store.latex, 'x\\frac{}{}y');
  assert.deepEqual(selection, [7, 7]);
  editor.store.textarea.selectionStart = 0;
  editor.store.textarea.selectionEnd = 3;
  editor.store.latex = 'x+y';
  editor.insertIntoSnippet({ kind: 'template', latex: '\\sqrt{@}' });
  assert.equal(editor.store.latex, '\\sqrt{x+y}');
  assert.deepEqual(selection, [9, 9]);
});

test('AxMath-only commands are translated to host-compatible equivalents', () => {
  const source = editor.compatibleLatex('\\ointclockwise_{@}^{}');
  assert.equal(source, '\\mathop{\\text{∲}}\\nolimits_{@}^{}');
  const parsed = editor.parseLatex(source.replace('@', 'a'))[0];
  assert.equal(parsed.type, 'integral');
  assert.equal(parsed.ch, '∲');
  assert.equal(parsed.sub[0].v, 'a');
  assert.equal(editor.compatibleLatex('\\nsubset'), '\\not\\subset');
  assert.ok(findClass(editor.renderMath('\\not\\subset'), 'dme-not'));
  assert.equal(editor.compatibleLatex('\\asin'), '\\operatorname{asin}');
  assert.equal(editor.compatibleLatex('a\\\\asin'), 'a\\\\asin');
});

test('Ctrl+Enter inserts once even when the key event bubbles from the textarea', () => {
  editor.store.open = true;
  editor.store.tab = 'greek';
  editor.store.latex = 'x';
  editor.store.mode = 'inline';
  editor.store.matrixConfig = null;
  let count = 0;
  const panel = editor.Panel({ inputActions: {
    captureInsertion: () => ({ start: 0, end: 0 }),
    insertText: () => { count += 1; return true; },
  } });
  const textarea = findClass(panel, 'dme-input');
  assert.ok(textarea);
  let stopped = false;
  const event = { key: 'Enter', ctrlKey: true, preventDefault() {}, stopPropagation() { stopped = true; } };
  textarea.props.onKeyDown(event);
  if (!stopped) panel.props.onKeyDown(event);
  assert.equal(count, 1);
  assert.equal(stopped, true);
});

test('visual editor supports direct in-slot typing on closed triple integral (\\oiiint_{@}{})', () => {
  const closedTriple = editor.AXMATH_INTEGRALS.find((item) => item && item.latex === '\\oiiint_{@}{}');
  assert.ok(closedTriple);

  let state = editor.visualInsertItem('', { slotId: 'root', index: 0, anchor: null }, closedTriple);
  assert.equal(state.latex, '\\oiiint_{}{}');

  // Both the lower-limit slot and the integrand slot render clickable dashed placeholder boxes
  const doc0 = editor.parseVisual(state.latex);
  const noopHandlers = {
    onSlotMouseDown() {},
    onSlotContainerMouseDown() {},
    onAtomMouseDown() {},
    onAtomMouseEnter() {},
  };
  const rendered0 = editor.renderVisualDoc(doc0, state.cursor, true, null, noopHandlers);
  assert.equal(countClass(rendered0, 'dme-slot-empty'), 2);
  assert.ok(findClass(rendered0, 'dme-caret'));

  // Type region D directly into the lower-limit slot
  state = editor.visualInsertText(state.latex, state.cursor, 'D');
  assert.equal(state.latex, '\\oiiint_{D}{}');

  // Press Tab (or ArrowRight) to jump directly into the integrand box and type f(x,y,z)
  const doc1 = editor.parseVisual(state.latex);
  const nextCursor = editor.visualMoveTab(doc1, state.cursor, false);
  state = editor.visualInsertText(state.latex, nextCursor, 'f(x,y,z)');
  assert.equal(state.latex, '\\oiiint_{D}{f(x,y,z)}');
});

test('visual editor handles ^ and _ shortcuts, sibling scripts, nested exponents and selection wrapping', () => {
  // Type x _ i ^ 2 sequentially without arrow keys -> x_{i}^{2}
  let state = editor.visualInsertText('', { slotId: 'root', index: 0, anchor: null }, 'x');
  state = editor.visualApplyScriptKey(state.latex, state.cursor, '_');
  state = editor.visualInsertText(state.latex, state.cursor, 'i');
  state = editor.visualApplyScriptKey(state.latex, state.cursor, '^');
  state = editor.visualInsertText(state.latex, state.cursor, '2');
  assert.equal(state.latex, 'x_{i}^{2}');

  // Type e ^ -x ^ 2 -> nested exponent e^{-x^{2}}
  let expState = editor.visualInsertText('', { slotId: 'root', index: 0, anchor: null }, 'e');
  expState = editor.visualApplyScriptKey(expState.latex, expState.cursor, '^');
  expState = editor.visualInsertText(expState.latex, expState.cursor, '-x');
  expState = editor.visualApplyScriptKey(expState.latex, expState.cursor, '^');
  expState = editor.visualInsertText(expState.latex, expState.cursor, '2');
  assert.equal(expState.latex, 'e^{-x^{2}}');

  // Select x+y in visual mode and wrap with \sqrt{@}
  let wrapState = editor.visualInsertText('', { slotId: 'root', index: 0, anchor: null }, 'x+y');
  const doc = editor.parseVisual(wrapState.latex);
  const rootSlot = doc.slots.get('root');
  const fullSelection = { slotId: 'root', index: rootSlot.atoms.length, anchor: 0 };
  wrapState = editor.visualInsertItem(wrapState.latex, fullSelection, { kind: 'template', latex: '\\sqrt{@}' });
  assert.equal(wrapState.latex, '\\sqrt{x+y}');
});

test('visual editor executes inline \\commands, guards control-word spaces, and supports undo/redo', () => {
  // \alpha followed by x automatically inserts space -> \alpha x
  let state = editor.visualExecuteCommand('', { slotId: 'root', index: 0, anchor: null }, 'alpha');
  state = editor.visualInsertText(state.latex, state.cursor, 'x');
  assert.equal(state.latex, '\\alpha x');

  // \left\langle @\right\rangle followed by typing x keeps space after \langle
  let angleState = editor.visualInsertItem('', { slotId: 'root', index: 0, anchor: null },
    { kind: 'template', latex: '\\left\\langle @\\right\\rangle' });
  angleState = editor.visualInsertText(angleState.latex, angleState.cursor, 'u');
  assert.equal(angleState.latex, '\\left\\langle u\\right\\rangle');

  // Chinese text outside \text{...} auto-wraps in \text{...}
  const cjk = editor.visualInsertText('', { slotId: 'root', index: 0, anchor: null }, '当');
  assert.equal(cjk.latex, '\\text{当}');

  // Undo & redo on store
  editor.store.latex = '';
  editor.store.visualCursor = { slotId: 'root', index: 0, anchor: null };
  editor.store.history = [];
  editor.store.future = [];
  const step1 = editor.visualInsertText('', editor.store.visualCursor, 'a+b');
  editor.store.commitVisual(step1.latex, step1.cursor);
  const step2 = editor.visualExecuteCommand(editor.store.latex, editor.store.visualCursor, 'frac');
  editor.store.commitVisual(step2.latex, step2.cursor);
  assert.equal(editor.store.latex, 'a+b\\frac{}{}');
  assert.equal(editor.store.undoVisual(), true);
  assert.equal(editor.store.latex, 'a+b');
  assert.equal(editor.store.redoVisual(), true);
  assert.equal(editor.store.latex, 'a+b\\frac{}{}');
});

test('structural backspace unwraps roots, removes empty scripts, and preserves matrix cells', () => {
  // Backspace at start of \sqrt{x} unwraps to x
  const sqrtDoc = editor.parseVisual('\\sqrt{x}');
  const radSlot = Array.from(sqrtDoc.slots.values()).find((s) => s.role === 'radicand');
  const unwrapped = editor.visualDeleteBackward('\\sqrt{x}', { slotId: radSlot.id, index: 0, anchor: null });
  assert.equal(unwrapped.latex, 'x');

  // Clearing a matrix cell preserves {} so empty rows do not collapse
  let mat = editor.visualInsertItem('', { slotId: 'root', index: 0, anchor: null },
    { kind: 'template', latex: '\\begin{pmatrix} @ & {} \\\\ {} & {} \\end{pmatrix}' });
  mat = editor.visualInsertText(mat.latex, mat.cursor, '5');
  assert.equal(mat.latex, '\\begin{pmatrix}5& {} \\\\ {} & {} \\end{pmatrix}');
  mat = editor.visualDeleteBackward(mat.latex, mat.cursor);
  const matDoc = editor.parseVisual(mat.latex);
  const matAtom = matDoc.slots.get('root').atoms[0];
  assert.equal(matAtom.rowSlotIds.length, 2);
  assert.equal(matAtom.rowSlotIds[0].length, 2);
});

test('AxMath symbol and template renderers produce seamless radicals, SVG integrals, frames and special icons', () => {
  // Seamless SVG radical replaces misaligned text surd
  const sqrtTree = editor.renderMath('\\sqrt{\\frac{a}{b}}');
  assert.ok(findClass(sqrtTree, 'dme-sqrt-surd'));
  assert.ok(findClass(sqrtTree, 'dme-sqrt-svg'));

  // Calligraphic SVG integrals & stretchy delimiters
  const intTree = editor.renderMath('\\oiiint_{D}{f}');
  assert.ok(findClass(intTree, 'dme-int-svg'));
  const delimTree = editor.renderMath('\\left[\\!\\left[x\\right]\\!\\right]');
  assert.ok(findClass(delimTree, 'dme-delim-svg'));

  // Connected corner frame and long division
  assert.ok(findClass(editor.renderMath('\\ulcorner\\overline{x}\\downarrow'), 'dme-frame'));
  assert.ok(findClass(editor.renderMath('2\\overset{3}{\\overline{)6}}'), 'dme-longdiv'));

  // Custom matrix icon renders ellipsis circles while keeping rect/path counts distinct
  const customMat = editor.AXMATH_MATRICES[43];
  const customIcon = editor.MatrixIcon(customMat.matrixPreview);
  assert.ok(countType(customIcon, 'circle') > 0);

  // Spacing & phantom buttons render RootSpecialIcon SVGs
  const spaceCell = editor.CellButton({ item: editor.AXMATH_ROOTS[5], text: { insert: 'insert' } });
  assert.equal(spaceCell.children[0].type, editor.RootSpecialIcon);

  // Every single one of the 1,026 expanded palette items parses cleanly in both parseLatex and parseVisual
  for (const category of editor.CATEGORIES) {
    for (const item of category.expandedItems || category.items) {
      if (item.kind === 'matrixCustom') continue;
      const sample = editor.compatibleLatex(item.latex).replace(/@/g, 'x');
      assert.doesNotThrow(() => editor.parseLatex(sample), item.latex);
      const vDoc = editor.parseVisual(sample);
      assert.ok(vDoc.slots.has('root'), item.latex);
    }
  }
});

test('visualProcessInput handles rapid batched \\command streams and brace-delimited templates synchronously', () => {
  const root0 = { slotId: 'root', index: 0, anchor: null };

  // Rapid batched "\\mathrm" followed by Space + "dx" stays inside editable \mathrm{dx}
  let res = editor.visualProcessInput('', root0, null, '\\mathrm');
  assert.equal(res.cmdState.text, 'mathrm');
  res = editor.visualProcessInput(res.latex, res.cursor, res.cmdState, ' dx');
  assert.equal(res.latex, '\\mathrm{dx}');

  // Muscle-memory LaTeX typing "\\frac{a}{b}+1" populates numerator, denominator, and exits
  const fracRes = editor.visualProcessInput('', root0, null, '\\frac{a}{b}+1');
  assert.equal(fracRes.latex, '\\frac{a}{b}+1');

  // Full closed volume integral typed via batched stream: \oiiint_{@}{} -> \Omega -> Tab -> x^2+y^2\,\mathrm{d}V
  const closedTriple = editor.AXMATH_INTEGRALS.find((item) => item && item.latex === '\\oiiint_{@}{}');
  let intState = editor.visualInsertItem('', root0, closedTriple);
  let step1 = editor.visualProcessInput(intState.latex, intState.cursor, null, '\\Omega ');
  assert.equal(step1.latex, '\\oiiint_{\\Omega}{}');
  const nextCur = editor.visualMoveTab(editor.parseVisual(step1.latex), step1.cursor, false);
  let step2 = editor.visualProcessInput(step1.latex, nextCur, step1.cmdState, 'x^{2}+y^{2}\\,\\mathrm{d}V');
  assert.equal(step2.latex, '\\oiiint_{\\Omega}{x^{2}+y^{2}\\,\\mathrm{d}V}');
});

test('visual sink is uncontrolled for Windows IME, Launcher resets activeEditor on reopen, and IME math punctuation normalizes', () => {
  // 1. Reopening via Launcher after using LaTeX textarea resets activeEditor to 'visual'
  editor.store.open = false;
  editor.store.activeEditor = 'latex';
  const launcherTree = editor.Launcher();
  const launchBtn = findClass(launcherTree, 'dme-launch');
  assert.ok(launchBtn);
  launchBtn.props.onClick({ stopPropagation() {} });
  assert.equal(editor.store.open, true);
  assert.equal(editor.store.activeEditor, 'visual');

  // 2. VisualEditor sink is uncontrolled (no value prop) and not aria-hidden so Windows TSF IME never gets reset mid-composition
  editor.store.latex = '';
  editor.store.visualCursor = { slotId: 'root', index: 0, anchor: null };
  const visTree = editor.VisualEditor({ text: { visualLabel: '可视化编辑', empty: '空白' }, onCtrlEnter() {} });
  const sink = findClass(visTree, 'dme-visual-sink');
  assert.ok(sink);
  assert.equal(sink.props.value, undefined);
  assert.equal(sink.props.defaultValue, '');
  assert.equal(sink.props['aria-hidden'], undefined);

  // Direct non-IME input via onInput
  const fakeEl = { value: 'x+1' };
  sink.props.onInput({ currentTarget: fakeEl, nativeEvent: { isComposing: false } });
  assert.equal(fakeEl.value, '');
  assert.equal(editor.store.latex, 'x+1');

  // Windows TSF IME composition lifecycle (mid-composition onInput must NOT clear fakeEl.value or commit prematurely)
  sink.props.onCompositionStart();
  fakeEl.value = 'y';
  sink.props.onInput({ currentTarget: fakeEl, nativeEvent: { isComposing: true } });
  assert.equal(fakeEl.value, 'y', 'sink value must remain intact during active IME composition');
  assert.equal(editor.store.latex, 'x+1', 'no premature commit during IME preedit');
  sink.props.onKeyDown({ key: 'Backspace', keyCode: 229, nativeEvent: { isComposing: true }, preventDefault() { throw new Error('must ignore IME keydown'); } });
  fakeEl.value = '+y';
  sink.props.onCompositionEnd({ currentTarget: fakeEl, data: '+y' });
  assert.equal(fakeEl.value, '');
  assert.equal(editor.store.latex, 'x+1+y');

  // 3. Chinese IME punctuation normalizes to math shortcuts outside \text{...}
  const root0 = { slotId: 'root', index: 0, anchor: null };
  let punct = editor.visualProcessInput('', root0, null, 'x——i……2');
  assert.equal(punct.latex, 'x_{i}^{2}');
  const afterSup = editor.visualMoveTab(editor.parseVisual(punct.latex), punct.cursor, false);
  punct = editor.visualProcessInput(punct.latex, afterSup, punct.cmdState, '＝（a＋b）');
  assert.equal(punct.latex, 'x_{i}^{2}=(a+b)');
  let cmdPunct = editor.visualProcessInput('', root0, null, '、alpha ');
  assert.equal(cmdPunct.latex, '\\alpha');

  // 4. Panel onKeyDown forwards stray printable keys on non-input elements to visual editor
  const panel = editor.Panel({ inputActions: {} });
  panel.props.onKeyDown({
    key: 'z',
    target: { tagName: 'DIV' },
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    preventDefault() {},
    stopPropagation() {},
  });
  assert.equal(editor.store.latex, 'x+1+yz');
});

test('slant toggle button switches between "倾斜" and "不倾斜" on click and controls typed character slant', () => {
  editor.store.open = true;
  editor.store.lang = 'zh';
  editor.store.tab = 'greek';
  editor.store.charItalic = true;
  editor.store.latex = '';
  editor.store.visualCursor = { slotId: 'root', index: 0, anchor: null };
  editor.store.activeEditor = 'visual';

  // 1. Default state is slanted ("倾斜")
  let panel = editor.Panel({ inputActions: {} });
  let toggleBtn = findClass(panel, 'dme-slant-toggle');
  assert.ok(toggleBtn, 'slant toggle button should render in visual editor header');
  assert.equal(toggleBtn.children.join(''), '倾斜');
  assert.equal(toggleBtn.props['aria-pressed'], 'true');
  assert.equal(findClass(panel, 'is-upright'), null);

  // Mount VisualEditor so store.visualType / store.visualSink are bound
  const fakeSink = { value: '', focus() {} };
  editor.store.visualSink = fakeSink;
  let visTree = editor.VisualEditor({ text: { visualLabel: '可视化编辑', empty: '空白' }, onCtrlEnter() {} });
  let sink = findClass(visTree, 'dme-visual-sink');
  assert.ok(sink);

  // 2. Click toggle button -> switches to "不倾斜" (upright)
  toggleBtn.props.onClick();
  assert.equal(editor.store.charItalic, false);
  panel = editor.Panel({ inputActions: {} });
  toggleBtn = findClass(panel, 'dme-slant-toggle');
  assert.equal(toggleBtn.children.join(''), '不倾斜');
  assert.equal(toggleBtn.props['aria-pressed'], 'false');
  assert.ok(toggleBtn.props.className.split(' ').includes('is-upright'));
  const greekGrid = findClass(panel, 'dme-grid-greek');
  assert.ok(greekGrid.props.className.split(' ').includes('is-upright'));

  // 3. Typing characters one-by-one in "不倾斜" mode coalesces into \mathrm{...} while leaving digits/operators unwrapped
  fakeSink.value = 'd';
  sink.props.onInput({ currentTarget: fakeSink, nativeEvent: { isComposing: false } });
  assert.equal(editor.store.latex, '\\mathrm{d}');
  fakeSink.value = 'x';
  sink.props.onInput({ currentTarget: fakeSink, nativeEvent: { isComposing: false } });
  assert.equal(editor.store.latex, '\\mathrm{dx}');

  editor.store.latex = '';
  editor.store.visualCursor = { slotId: 'root', index: 0, anchor: null };
  fakeSink.value = 'f(x)=2x+1';
  sink.props.onInput({ currentTarget: fakeSink, nativeEvent: { isComposing: false } });
  assert.equal(editor.store.latex, '\\mathrm{f}(\\mathrm{x})=2\\mathrm{x}+1');

  // 4. Mixed derivative \frac{\mathrm{d}y}{\mathrm{d}x} by clicking the toggle button mid-expression
  editor.store.latex = '';
  editor.store.visualCursor = { slotId: 'root', index: 0, anchor: null };
  const fracRes = editor.visualInsertItem('', editor.store.visualCursor, { kind: 'template', latex: '\\frac{@}{}' });
  editor.store.commitVisual(fracRes.latex, fracRes.cursor);
  // Currently charItalic === false ("不倾斜"): type 'd'
  fakeSink.value = 'd';
  sink.props.onInput({ currentTarget: fakeSink, nativeEvent: { isComposing: false } });
  assert.equal(editor.store.latex, '\\frac{\\mathrm{d}}{}');
  // Click toggle -> back to "倾斜": type 'y'
  toggleBtn.props.onClick();
  assert.equal(editor.store.charItalic, true);
  panel = editor.Panel({ inputActions: {} });
  toggleBtn = findClass(panel, 'dme-slant-toggle');
  assert.equal(toggleBtn.children.join(''), '倾斜');
  fakeSink.value = 'y';
  sink.props.onInput({ currentTarget: fakeSink, nativeEvent: { isComposing: false } });
  assert.equal(editor.store.latex, '\\frac{\\mathrm{d}y}{}');
  // Tab to denominator, click toggle -> "不倾斜", type 'd', click toggle -> "倾斜", type 'x'
  editor.store.visualCursor = editor.visualMoveTab(editor.parseVisual(editor.store.latex), editor.store.visualCursor, false);
  toggleBtn.props.onClick();
  assert.equal(editor.store.charItalic, false);
  fakeSink.value = 'd';
  sink.props.onInput({ currentTarget: fakeSink, nativeEvent: { isComposing: false } });
  toggleBtn.props.onClick();
  assert.equal(editor.store.charItalic, true);
  fakeSink.value = 'x';
  sink.props.onInput({ currentTarget: fakeSink, nativeEvent: { isComposing: false } });
  assert.equal(editor.store.latex, '\\frac{\\mathrm{d}y}{\\mathrm{d}x}');

  // 5. English locale fallback labels
  editor.store.lang = 'en';
  let enPanel = editor.Panel({ inputActions: {} });
  assert.equal(findClass(enPanel, 'dme-slant-toggle').children.join(''), 'Italic');
  editor.store.charItalic = false;
  enPanel = editor.Panel({ inputActions: {} });
  assert.equal(findClass(enPanel, 'dme-slant-toggle').children.join(''), 'Upright');
  editor.store.lang = 'zh';
  editor.store.charItalic = true;
});

test('upright runs support 1-step Backspace/Delete/Arrow/Tab, split on italic insert, handle Greek slant, and convert selections', () => {
  const root0 = { slotId: 'root', index: 0, anchor: null };

  // 1. Typing italic inside \mathrm{abcd} splits cleanly into \mathrm{ab}x\mathrm{cd}
  const docRm = editor.parseVisual('\\mathrm{abcd}');
  const rmAtom = docRm.slots.get('root').atoms[0];
  const splitRes = editor.visualInsertText('\\mathrm{abcd}', { slotId: rmAtom.bodySlotId, index: 2, anchor: null }, 'x', { charItalic: true });
  assert.equal(splitRes.latex, '\\mathrm{ab}x\\mathrm{cd}');

  // 2. Backspace and Delete remove upright characters one at a time without leaving empty \mathrm{}
  let back1 = editor.visualDeleteBackward('\\mathrm{dx}', { slotId: 'root', index: 1, anchor: null });
  assert.equal(back1.latex, '\\mathrm{d}');
  let back2 = editor.visualDeleteBackward(back1.latex, back1.cursor);
  assert.equal(back2.latex, '');

  let del1 = editor.visualDeleteForward('\\mathrm{dx}', root0);
  assert.equal(del1.latex, '\\mathrm{x}');
  let del2 = editor.visualDeleteForward(del1.latex, del1.cursor);
  assert.equal(del2.latex, '');

  // 3. ArrowRight steps once per character across \mathrm{ab}, and Tab skips \mathrm{d} to jump to empty template slot
  const navDoc = editor.parseVisual('\\mathrm{ab}');
  let c1 = editor.visualMoveHorizontal(navDoc, root0, 1, false);
  let c2 = editor.visualMoveHorizontal(navDoc, c1, 1, false);
  assert.deepEqual(plain(c2), { slotId: 'root', index: 1, anchor: null });

  const tabDoc = editor.parseVisual('\\frac{\\mathrm{d}}{}');
  const numSlotId = tabDoc.slots.get('root').atoms[0].numSlotId;
  const denSlotId = tabDoc.slots.get('root').atoms[0].denSlotId;
  const tabbed = editor.visualMoveTab(tabDoc, { slotId: numSlotId, index: 0, anchor: null }, false);
  assert.equal(tabbed.slotId, denSlotId);

  // 4. Greek symbols respect charItalic both in LaTeX output and visual rendering classes
  const alphaSlanted = editor.visualExecuteCommand('', root0, 'alpha', { charItalic: true });
  assert.equal(alphaSlanted.latex, '\\alpha');
  const alphaUpright = editor.visualExecuteCommand('', root0, 'alpha', { charItalic: false });
  assert.equal(alphaUpright.latex, '\\text{α}');
  const deltaSlanted = editor.visualInsertItem('', root0, { kind: 'symbol', latex: '\\varDelta' }, { charItalic: true });
  assert.equal(deltaSlanted.latex, '\\varDelta');
  const deltaUpright = editor.visualInsertItem('', root0, { kind: 'symbol', latex: '\\varDelta' }, { charItalic: false });
  assert.equal(deltaUpright.latex, '\\Delta');

  // Render check: \alpha & \varDelta use dme-var; \text{α} & \Delta use dme-sym
  const noopHandlers = {
    onSlotMouseDown() {},
    onSlotContainerMouseDown() {},
    onAtomMouseDown() {},
    onAtomMouseEnter() {},
  };
  const visUprightAlpha = editor.renderVisualDoc(editor.parseVisual('\\text{α}'), root0, false, null, noopHandlers, '');
  assert.equal(countClass(visUprightAlpha, 'dme-var'), 0);
  assert.equal(countClass(visUprightAlpha, 'dme-sym'), 1);
  const visVarDelta = editor.renderVisualDoc(editor.parseVisual('\\varDelta'), root0, false, null, noopHandlers, '');
  assert.equal(countClass(visVarDelta, 'dme-var'), 1);
  const previewVarDelta = editor.renderMath('\\varDelta', false);
  assert.equal(countClass(previewVarDelta, 'dme-var'), 1);
  const previewUprightDelta = editor.renderMath('\\Delta', false);
  assert.equal(countClass(previewUprightDelta, 'dme-var'), 0);
  assert.equal(countClass(previewUprightDelta, 'dme-sym'), 1);

  // 5. Selection conversion via visualApplySlant & clicking the toggle button
  // Whole-expression conversion on \frac{dy+\alpha}{dx+\varDelta} <-> upright and back
  const srcFormula = '\\frac{dy+\\alpha}{dx+\\varDelta}';
  const toUpright = editor.visualApplySlant(srcFormula, { slotId: 'root', index: 1, anchor: 0 }, false);
  assert.equal(toUpright.latex, '\\frac{\\mathrm{dy}+\\text{α}}{\\mathrm{dx}+\\Delta}');
  assert.deepEqual(plain(toUpright.cursor), { slotId: 'root', index: 1, anchor: 0 });
  const backToItalic = editor.visualApplySlant(toUpright.latex, toUpright.cursor, true);
  assert.equal(backToItalic.latex, srcFormula);

  // Partial selection inside \mathrm{abcd} (indices 1..3 = "bc") converted to italic -> \mathrm{a}bc\mathrm{d}
  const rmBodyId = docRm.slots.get('root').atoms[0].bodySlotId;
  const partialItalic = editor.visualApplySlant('\\mathrm{abcd}', { slotId: rmBodyId, index: 3, anchor: 1 }, true);
  assert.equal(partialItalic.latex, '\\mathrm{a}bc\\mathrm{d}');
  assert.deepEqual(plain(partialItalic.cursor), { slotId: 'root', index: 3, anchor: 1 });
});

test('panel layout CSS prevents flex collapse in DSH composer dock and wraps category tabs cleanly', () => {
  const css = editor.CSS;
  const ruleOf = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = new RegExp('(?:^|\\n)' + escaped + '\\{([^}]+)\\}').exec(css);
    return m ? m[1] : '';
  };

  const panelRule = ruleOf('.dme-panel');
  assert.ok(panelRule.includes('flex:none'), '.dme-panel must set flex:none so DSH hero/composer flex stacks never crush it');
  assert.ok(panelRule.includes('container-type:inline-size'), '.dme-panel should size responsive breakpoints by container width');
  assert.ok(panelRule.includes('--dsh-composer-card-max-width'), '.dme-panel should align width with DSH composer card');
  assert.ok(panelRule.includes('--dsh-conversation-viewport-height'), '.dme-panel should bound max-height by DSH viewport height');

  const tabsRule = ruleOf('.dme-tabs');
  assert.ok(tabsRule.includes('flex:none'), '.dme-tabs must not shrink vertically');
  assert.ok(tabsRule.includes('flex-wrap:wrap'), '.dme-tabs should wrap category pills instead of hiding them under a scrollbar');
  assert.ok(!tabsRule.includes('overflow-x:auto'), '.dme-tabs must not create a horizontal scrollbar that covers tab labels');

  const bodyRule = ruleOf('.dme-body');
  assert.ok(bodyRule.includes('min-height:0') && bodyRule.includes('overflow-y:auto'),
    '.dme-body must scroll internally when viewport max-height applies rather than clipping controls');

  for (const fixedRow of ['.dme-head', '.dme-editor-label', '.dme-visual', '.dme-input', '.dme-foot']) {
    assert.ok(ruleOf(fixedRow).includes('flex:none'), `${fixedRow} must set flex:none so editor controls stay fully visible`);
  }
});
