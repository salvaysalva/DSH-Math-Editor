/**
 * Math Editor — AxMath-style formula editor for the DeepSeek Harness composer.
 *
 * Shape of this artifact: the Web module loader runs the factory below in the
 * page and expects the plugin object back. React comes from the browser module
 * table, so no dependency is installed and no second React is loaded.
 *
 * Sections
 *   1. Palette data      — AxMath-style categories and LaTeX snippets
 *   2. LaTeX preview     — a small, dependency-free parser + renderer
 *   3. Shared state      — the open panel, active tab, current formula
 *   4. Components        — launcher button, symbol palette, preview, input
 *   5. apply()           — slot registrations and cleanup
 */
window.__ModuleLoader__.load({
  id: '@local/math-editor',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /* =======================================================================
     * 1. Palette data
     * ===================================================================== */

    /** A palette symbol: a LaTeX command with a single Unicode glyph. */
    const sym = (latex, ch, name) => ({ kind: 'symbol', latex, ch, name });

    /**
     * A palette template: `latex` is inserted into the formula, a `@` marks the
     * caret position inside it, and `preview` is what the button renders.
     */
    const tpl = (latex, preview, name) => ({ kind: 'template', latex, preview, name });

    /** Parse `latex|glyph|name` lines into palette symbols. */
    function block(text) {
      return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
          const parts = line.split('|');
          const latex = parts[0].trim();
          const name = parts.length > 2 ? parts[parts.length - 1].trim() : '';
          const ch = parts.slice(1, Math.max(1, parts.length - 1)).join('|').trim();
          return sym(latex, ch, name);
        });
    }

    const GREEK = block(`
\\alpha|α|alpha
\\beta|β|beta
\\gamma|γ|gamma
\\delta|δ|delta
\\epsilon|ϵ|epsilon
\\varepsilon|ε|varepsilon
\\zeta|ζ|zeta
\\eta|η|eta
\\theta|θ|theta
\\vartheta|ϑ|vartheta
\\iota|ι|iota
\\kappa|κ|kappa
\\varkappa|ϰ|varkappa
\\lambda|λ|lambda
\\mu|μ|mu
\\nu|ν|nu
\\xi|ξ|xi
\\omicron|ο|omicron
\\pi|π|pi
\\varpi|ϖ|varpi
\\rho|ρ|rho
\\varrho|ϱ|varrho
\\sigma|σ|sigma
\\varsigma|ς|varsigma
\\tau|τ|tau
\\upsilon|υ|upsilon
\\phi|ϕ|phi
\\varphi|φ|varphi
\\chi|χ|chi
\\psi|ψ|psi
\\omega|ω|omega
\\digamma|ϝ|digamma
\\Gamma|Γ|Gamma
\\Delta|Δ|Delta
\\Theta|Θ|Theta
\\Lambda|Λ|Lambda
\\Xi|Ξ|Xi
\\Pi|Π|Pi
\\Sigma|Σ|Sigma
\\Upsilon|Υ|Upsilon
\\Phi|Φ|Phi
\\Psi|Ψ|Psi
\\Omega|Ω|Omega
\\varDelta|Δ|varDelta
\\varGamma|Γ|varGamma
\\varLambda|Λ|varLambda
\\varPi|Π|varPi
\\varTheta|Θ|varTheta
\\varSigma|Σ|varSigma
\\varOmega|Ω|varOmega
\\varXi|Ξ|varXi
\\varPsi|Ψ|varPsi
\\varUpsilon|Υ|varUpsilon
\\varPhi|Φ|varPhi
`);

    const BINARY = block(`
\\pm|±|pm
\\mp|∓|mp
\\times|×|times
\\div|÷|div
\\cdot|⋅|cdot
\\cdotp|·|cdotp
\\ast|∗|ast
\\star|⋆|star
\\circ|∘|circ
\\bullet|•|bullet
\\oplus|⊕|oplus
\\ominus|⊖|ominus
\\otimes|⊗|otimes
\\oslash|⊘|oslash
\\odot|⊙|odot
\\bigcirc|◯|bigcirc
\\diamond|⋄|diamond
\\triangleleft|◁|triangleleft
\\triangleright|▷|triangleright
\\wedge|∧|wedge
\\vee|∨|vee
\\cap|∩|cap
\\cup|∪|cup
\\Cap|⋒|Cap
\\Cup|⋓|Cup
\\setminus|∖|setminus
\\smallsetminus|∖|smallsetminus
\\uplus|⊎|uplus
\\sqcap|⊓|sqcap
\\sqcup|⊔|sqcup
\\amalg|⨿|amalg
\\dagger|†|dagger
\\ddagger|‡|ddagger
\\wr|≀|wr
\\ltimes|⋉|ltimes
\\rtimes|⋊|rtimes
\\leftthreetimes|⋋|leftthreetimes
\\rightthreetimes|⋌|rightthreetimes
\\dotplus|∔|dotplus
\\intercal|⊺|intercal
\\barwedge|⊼|barwedge
\\veebar|⊻|veebar
\\doublebarwedge|⩞|doublebarwedge
\\circledast|⊛|circledast
\\circledcirc|⊚|circledcirc
\\circleddash|⊝|circleddash
\\divideontimes|⋇|divideontimes
\\boxplus|⊞|boxplus
\\boxminus|⊟|boxminus
\\boxtimes|⊠|boxtimes
\\boxdot|⊡|boxdot
\\curlywedge|⋏|curlywedge
\\curlyvee|⋎|curlyvee
\\lhd|⊲|lhd
\\rhd|⊳|rhd
\\unlhd|⊴|unlhd
\\unrhd|⊵|unrhd
\\Join|⋈|Join
\\doublecap|⩀|doublecap
\\doublecup|⩁|doublecup
\\And|&|And
\\Box|□|Box
\\Diamond|◇|Diamond
\\bigtriangleup|△|bigtriangleup
\\bigtriangledown|▽|bigtriangledown
\\blacktriangleup|▲|blacktriangleup
\\blacktriangledown|▼|blacktriangledown
\\blacktriangleleft|◀|blacktriangleleft
\\blacktriangleright|▶|blacktriangleright
`);

    const RELATION = block(`
=|=|eq
\\neq|≠|neq
\\approx|≈|approx
\\approxeq|≊|approxeq
\\equiv|≡|equiv
\\sim|∼|sim
\\simeq|≃|simeq
\\cong|≅|cong
\\propto|∝|propto
\\ll|≪|ll
\\gg|≫|gg
\\lll|⋘|lll
\\ggg|⋙|ggg
\\le|≤|le
\\leq|≤|leq
\\ge|≥|ge
\\geq|≥|geq
\\leqslant|⩽|leqslant
\\geqslant|⩾|geqslant
\\leqq|≦|leqq
\\geqq|≧|geqq
\\lesssim|≲|lesssim
\\gtrsim|≳|gtrsim
\\lessapprox|⪅|lessapprox
\\gtrapprox|⪆|gtrapprox
\\lessdot|⋖|lessdot
\\gtrdot|⋗|gtrdot
\\lessgtr|≶|lessgtr
\\gtrless|≷|gtrless
\\lesseqgtr|⋚|lesseqgtr
\\gtreqless|⋛|gtreqless
\\lesseqqgtr|⪋|lesseqqgtr
\\gtreqqless|⪌|gtreqqless
\\prec|≺|prec
\\succ|≻|succ
\\preceq|⪯|preceq
\\succeq|⪰|succeq
\\precsim|≾|precsim
\\succsim|≿|succsim
\\precapprox|⪷|precapprox
\\succapprox|⪸|succapprox
\\subset|⊂|subset
\\supset|⊃|supset
\\subseteq|⊆|subseteq
\\supseteq|⊇|supseteq
\\subsetneq|⊊|subsetneq
\\supsetneq|⊋|supsetneq
\\subseteqq|⫅|subseteqq
\\supseteqq|⫆|supseteqq
\\sqsubset|⊏|sqsubset
\\sqsupset|⊐|sqsupset
\\sqsubseteq|⊑|sqsubseteq
\\sqsupseteq|⊒|sqsupseteq
\\in|∈|in
\\notin|∉|notin
\\ni|∋|ni
\\owns|∋|owns
\\doteq|≐|doteq
\\doteqdot|≑|doteqdot
\\fallingdotseq|≒|fallingdotseq
\\risingdotseq|≓|risingdotseq
\\eqcirc|≖|eqcirc
\\circeq|≗|circeq
\\bumpeq|≏|bumpeq
\\Bumpeq|≎|Bumpeq
\\asymp|≍|asymp
\\eqsim|≂|eqsim
\\triangleq|≜|triangleq
\\bowtie|⋈|bowtie
\\models|⊨|models
\\vdash|⊢|vdash
\\dashv|⊣|dashv
\\vDash|⊨|vDash
\\Vdash|⊩|Vdash
\\Vvdash|⊪|Vvdash
\\nVDash|⊯|nVDash
\\nVdash|⊮|nVdash
\\perp|⊥|perp
\\parallel|∥|parallel
\\nparallel|∦|nparallel
\\mid|∣|mid
\\nmid|∤|nmid
\\smile|⌣|smile
\\frown|⌢|frown
\\between|≬|between
\\therefore|∴|therefore
\\because|∵|because
\\nless|≮|nless
\\ngtr|≯|ngtr
\\nleq|≰|nleq
\\ngeq|≱|ngeq
\\napprox|≉|napprox
\\ncong|≇|ncong
\\nsim|≁|nsim
\\lnapprox|⪉|lnapprox
\\gnapprox|⪊|gnapprox
\\lneqq|≨|lneqq
\\gneqq|≩|gneqq
\\lvertneqq|≨|lvertneqq
\\gvertneqq|≩|gvertneqq
\\eqslantless|⪕|eqslantless
\\eqslantgtr|⪖|eqslantgtr
\\curlyeqprec|⋞|curlyeqprec
\\curlyeqsucc|⋟|curlyeqsucc
\\Subset|⋐|Subset
\\Supset|⋑|Supset
\\backepsilon|϶|backepsilon
\\backsim|∽|backsim
\\backsimeq|⋍|backsimeq
\\nsubset|⊄|nsubset
\\nsupset|⊅|nsupset
\\varparallel|⫲|varparallel
\\parallelequal|⫲|parallelequal
\\precnapprox|⪹|precnapprox
\\succnapprox|⪺|succnapprox
\\gneq|⪈|gneq
\\lneq|⪇|lneq
\\ne|≠|ne
\\nprec|⊀|nprec
\\nsucc|⊁|nsucc
\\nsubset|⊄|nsubset
\\nsupseteq|⊉|nsupseteq
`);

    const ARROW = block(`
\\leftarrow|←|leftarrow
\\rightarrow|→|rightarrow
\\to|→|to
\\gets|←|gets
\\leftrightarrow|↔|leftrightarrow
\\Leftarrow|⇐|Leftarrow
\\Rightarrow|⇒|Rightarrow
\\Leftrightarrow|⇔|Leftrightarrow
\\uparrow|↑|uparrow
\\downarrow|↓|downarrow
\\updownarrow|↕|updownarrow
\\Uparrow|⇑|Uparrow
\\Downarrow|⇓|Downarrow
\\Updownarrow|⇕|Updownarrow
\\mapsto|↦|mapsto
\\longmapsto|⟼|longmapsto
\\longrightarrow|⟶|longrightarrow
\\longleftarrow|⟵|longleftarrow
\\longleftrightarrow|⟷|longleftrightarrow
\\Longrightarrow|⟹|Longrightarrow
\\Longleftarrow|⟸|Longleftarrow
\\Longleftrightarrow|⟺|Longleftrightarrow
\\hookrightarrow|↪|hookrightarrow
\\hookleftarrow|↩|hookleftarrow
\\nearrow|↗|nearrow
\\searrow|↘|searrow
\\swarrow|↙|swarrow
\\nwarrow|↖|nwarrow
\\rightharpoonup|⇀|rightharpoonup
\\rightharpoondown|⇁|rightharpoondown
\\leftharpoonup|↼|leftharpoonup
\\leftharpoondown|↽|leftharpoondown
\\rightleftharpoons|⇌|rightleftharpoons
\\leftrightharpoons|⇋|leftrightharpoons
\\rightrightarrows|⇉|rightrightarrows
\\leftleftarrows|⇇|leftleftarrows
\\rightleftarrows|⇄|rightleftarrows
\\leftrightarrows|⇆|leftrightarrows
\\upuparrows|⇈|upuparrows
\\downdownarrows|⇊|downdownarrows
\\twoheadrightarrow|↠|twoheadrightarrow
\\twoheadleftarrow|↞|twoheadleftarrow
\\rightarrowtail|↣|rightarrowtail
\\leftarrowtail|↢|leftarrowtail
\\curvearrowright|↷|curvearrowright
\\curvearrowleft|↶|curvearrowleft
\\circlearrowright|↻|circlearrowright
\\circlearrowleft|↺|circlearrowleft
\\implies|⟹|implies
\\iff|⟺|iff
\\leadsto|↝|leadsto
\\rightsquigarrow|⇝|rightsquigarrow
\\leftrightsquigarrow|↭|leftrightsquigarrow
\\multimap|⊸|multimap
\\looparrowleft|↫|looparrowleft
\\looparrowright|↬|looparrowright
\\nrightarrow|↛|nrightarrow
\\nleftarrow|↚|nleftarrow
\\nleftrightarrow|↮|nleftrightarrow
\\nRightarrow|⇏|nRightarrow
\\nLeftarrow|⇍|nLeftarrow
\\nLeftrightarrow|⇎|nLeftrightarrow
\\dashrightarrow|⇢|dashrightarrow
\\dashleftarrow|⇠|dashleftarrow
\\upharpoonleft|↿|upharpoonleft
\\upharpoonright|↾|upharpoonright
\\downharpoonleft|⇃|downharpoonleft
\\downharpoonright|⇂|downharpoonright
\\Lsh|↰|Lsh
\\Rsh|↱|Rsh
\\Lleftarrow|⇚|Lleftarrow
\\Rrightarrow|⇛|Rrightarrow
\\dasharrow|⇢|dasharrow
\\leftsquigarrow|⇜|leftsquigarrow
`);

    const BRACKET = block(`
(|(|lparen
)|)|rparen
[|[|lbracket
]|]|rbracket
\\{|{|lbrace
\\}|}|rbrace
\\langle|⟨|langle
\\rangle|⟩|rangle
\\lceil|⌈|lceil
\\rceil|⌉|rceil
\\lfloor|⌊|lfloor
\\rfloor|⌋|rfloor
\\Vert|‖|Vert
\\lvert|||lvert
\\rvert|||rvert
\\lVert|‖|lVert
\\rVert|‖|rVert
\\ulcorner|⌜|ulcorner
\\urcorner|⌝|urcorner
\\llcorner|⌞|llcorner
\\lrcorner|⌟|lrcorner
\\lgroup|⟮|lgroup
\\rgroup|⟯|rgroup
\\lmoustache|⎰|lmoustache
\\rmoustache|⎱|rmoustache
\\backslash|\\|backslash
\\diagup|╱|diagup
\\diagdown|╲|diagdown
`);

    const SETS = block(`
\\emptyset|∅|emptyset
\\varnothing|∅|varnothing
\\forall|∀|forall
\\exists|∃|exists
\\nexists|∄|nexists
\\neg|¬|neg
\\lnot|¬|lnot
\\land|∧|land
\\lor|∨|lor
\\top|⊤|top
\\bot|⊥|bot
\\complement|∁|complement
\\aleph|ℵ|aleph
\\beth|ℶ|beth
\\gimel|ℷ|gimel
\\daleth|ℸ|daleth
\\hbar|ℏ|hbar
\\hslash|ℏ|hslash
\\ell|ℓ|ell
\\wp|℘|wp
\\Re|ℜ|Re
\\Im|ℑ|Im
\\mho|℧|mho
\\eth|ð|eth
\\imath|ı|imath
\\jmath|ȷ|jmath
\\backprime|‵|backprime
\\angle|∠|angle
\\measuredangle|∡|measuredangle
\\sphericalangle|∢|sphericalangle
\\triangle|△|triangle
\\blacktriangle|▲|blacktriangle
\\triangledown|▽|triangledown
\\square|□|square
\\blacksquare|■|blacksquare
\\lozenge|◊|lozenge
\\blacklozenge|⧫|blacklozenge
\\bigstar|★|bigstar
\\maltese|✠|maltese
\\clubsuit|♣|clubsuit
\\diamondsuit|♢|diamondsuit
\\heartsuit|♡|heartsuit
\\spadesuit|♠|spadesuit
\\flat|♭|flat
\\natural|♮|natural
\\sharp|♯|sharp
\\checkmark|✓|checkmark
\\circledR|®|circledR
\\circledS|Ⓢ|circledS
\\Finv|Ⅎ|Finv
\\Game|⅁|Game
\\Bbbk|𝕜|Bbbk
\\S|§|S
\\P|¶|P
\\copyright|©|copyright
\\pounds|£|pounds
\\%|%|percent
\\&|&|amp
\\Bbbk|𝕜|Bbbk
\\mho|℧|mho
\\eth|ð|eth
\\daleth|ℸ|daleth
\\dag|†|dag
\\ddag|‡|ddag
\\textperthousand|‰|perthousand
\\text{¶}|¶|pilcrow
`);

    const CALCULUS = block(`
\\partial|∂|partial
\\nabla|∇|nabla
\\infty|∞|infty
\\prime|′|prime
\\ldots|…|ldots
\\cdots|⋯|cdots
\\vdots|⋮|vdots
\\ddots|⋱|ddots
\\dots|…|dots
\\degree|°|degree
\\Delta|Δ|Delta
\\delta|δ|delta
\\to|→|to
\\mapsto|↦|mapsto
\\ell|ℓ|ell
\\hbar|ℏ|hbar
\\Re|ℜ|Re
\\Im|ℑ|Im
\\wp|℘|wp
\\imath|ı|imath
\\jmath|ȷ|jmath
\\mathrm{d}|d|d
\\degree|°|degree
ƛ|ƛ|lambdabar
`);

    const INTEGRAL_SYMBOLS = block(`
\\int|∫|int
\\iint|∬|iint
\\iiint|∭|iiint
\\iiiint|⨌|iiiint
\\oint|∮|oint
\\oiint|∯|oiint
\\oiiint|∰|oiiint
\\intop|∫|intop
\\smallint|∫|smallint
\\fint|⨏|fint
\\varointclockwise|∲|varointclockwise
\\ointctrclockwise|∳|ointctrclockwise
\\sumint|⨋|sumint
\\intclockwise|∱|intclockwise
`);

    const BIGOPS_SYMBOLS = block(`
\\sum|∑|sum
\\prod|∏|prod
\\coprod|∐|coprod
\\bigcup|⋃|bigcup
\\bigcap|⋂|bigcap
\\bigsqcup|⨆|bigsqcup
\\bigsqcap|⨅|bigsqcap
\\bigvee|⋁|bigvee
\\bigwedge|⋀|bigwedge
\\bigoplus|⨁|bigoplus
\\bigotimes|⨂|bigotimes
\\bigodot|⨀|bigodot
\\biguplus|⨄|biguplus
\\bigtimes|⨉|bigtimes
`);

    const FUNCTIONS = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'abs', 'acos', 'asin', 'atan', 'acot', 'acsc', 'asec', 'arcsin', 'arccos', 'arctan', 'arccot', 'arcsec', 'arccsc', 'sinh', 'cosh', 'tanh', 'coth', 'sech', 'csch', 'log', 'ln', 'lg', 'exp', 'det', 'dim', 'ker', 'deg', 'arg', 'gcd', 'hom', 'Pr', 'min', 'max', 'sup', 'inf', 'lim', 'liminf', 'limsup', 'bmod', 'mod'].map((name) => sym('\\' + name, name, name));

    function matrixTemplate(environment, rows, columns, name, alignment = 'c') {
      const cellRows = (preview) => Array.from({ length: rows }, (_, row) =>
        Array.from({ length: columns }, (_, column) => preview ? '□' : row === 0 && column === 0 ? '@' : '{}').join(' & '),
      ).join(' \\\\ ');
      const isArray = environment === 'array' || environment === 'rightbrace' || environment === 'leftbrace' || alignment !== 'c';
      const actualEnvironment = isArray ? 'array' : environment;
      const spec = isArray ? '{' + alignment.repeat(columns) + '}' : '';
      const left = { pmatrix: '(', bmatrix: '[', vmatrix: '|', leftbrace: '\\{', rightbrace: '.' };
      const right = { pmatrix: ')', bmatrix: ']', vmatrix: '|', leftbrace: '.', rightbrace: '\\}' };
      const wrap = (body) => {
        let result = '\\begin{' + actualEnvironment + '}' + spec + ' ' + body + ' \\end{' + actualEnvironment + '}';
        if (isArray && left[environment] !== undefined) result = '\\left' + left[environment] + result + '\\right' + right[environment];
        return result;
      };
      return { ...tpl(wrap(cellRows(false)), wrap(cellRows(true)), name),
        matrixPreview: { environment, rows, columns } };
    }

    function customMatrix(environment, rowInput, columnInput, name) {
      const rows = rowInput ? 3 : 1;
      const columns = columnInput ? 3 : 1;
      return { kind: 'matrixCustom', environment, rowInput, columnInput, name,
        preview: matrixTemplate(environment, rows, columns, name).preview,
        matrixPreview: { environment, rows, columns, custom: true, alignedEq: environment === 'array' } };
    }

    // Four rows of thirteen buttons, matching AxMath's matrix palette.
    const AXMATH_MATRICES = [
      sym('\\cdots', '⋯', 'horizontal dots'),
      matrixTemplate('vmatrix', 2, 2, '2×2 determinant'),
      matrixTemplate('pmatrix', 1, 2, '2-element row vector'),
      matrixTemplate('pmatrix', 2, 1, '2-element column vector'),
      matrixTemplate('pmatrix', 2, 2, '2×2 parentheses'),
      matrixTemplate('bmatrix', 1, 2, '2-element bracketed row'),
      matrixTemplate('bmatrix', 2, 1, '2-element bracketed column'),
      matrixTemplate('bmatrix', 2, 2, '2×2 brackets'),
      matrixTemplate('matrix', 1, 2, '2-element row'),
      matrixTemplate('matrix', 2, 1, '2-element column'),
      matrixTemplate('matrix', 2, 2, '2×2 matrix'),
      matrixTemplate('rightbrace', 2, 1, '2-line right brace', 'r'),
      matrixTemplate('leftbrace', 2, 1, '2-line left brace', 'l'),

      sym('\\ddots', '⋱', 'diagonal dots'),
      matrixTemplate('vmatrix', 3, 3, '3×3 determinant'),
      matrixTemplate('pmatrix', 1, 3, '3-element row vector'),
      matrixTemplate('pmatrix', 3, 1, '3-element column vector'),
      matrixTemplate('pmatrix', 3, 3, '3×3 parentheses'),
      matrixTemplate('bmatrix', 1, 3, '3-element bracketed row'),
      matrixTemplate('bmatrix', 3, 1, '3-element bracketed column'),
      matrixTemplate('bmatrix', 3, 3, '3×3 brackets'),
      matrixTemplate('matrix', 1, 3, '3-element row'),
      matrixTemplate('matrix', 3, 1, '3-element column'),
      matrixTemplate('matrix', 3, 3, '3×3 matrix'),
      matrixTemplate('rightbrace', 3, 1, '3-line right brace', 'r'),
      matrixTemplate('leftbrace', 3, 1, '3-line left brace', 'l'),

      sym('\\vdots', '⋮', 'vertical dots'),
      matrixTemplate('vmatrix', 4, 4, '4×4 determinant'),
      matrixTemplate('pmatrix', 1, 4, '4-element row vector'),
      matrixTemplate('pmatrix', 4, 1, '4-element column vector'),
      matrixTemplate('pmatrix', 4, 4, '4×4 parentheses'),
      matrixTemplate('bmatrix', 1, 4, '4-element bracketed row'),
      matrixTemplate('bmatrix', 4, 1, '4-element bracketed column'),
      matrixTemplate('bmatrix', 4, 4, '4×4 brackets'),
      matrixTemplate('matrix', 1, 4, '4-element row'),
      matrixTemplate('matrix', 4, 1, '4-element column'),
      matrixTemplate('matrix', 4, 4, '4×4 matrix'),
      { ...matrixTemplate('array', 2, 1, '2-line aligned array', 'l'),
        matrixPreview: { environment: 'array', rows: 2, columns: 1, alignedEq: true } },
      customMatrix('array', true, false, 'custom aligned array'),

      sym('\\mathinner{\\text{⋰}}', '⋰', 'rising diagonal dots'),
      customMatrix('vmatrix', true, true, 'custom determinant'),
      customMatrix('pmatrix', false, true, 'custom row vector'),
      customMatrix('pmatrix', true, false, 'custom column vector'),
      customMatrix('pmatrix', true, true, 'custom parenthesized matrix'),
      customMatrix('bmatrix', false, true, 'custom bracketed row'),
      customMatrix('bmatrix', true, false, 'custom bracketed column'),
      customMatrix('bmatrix', true, true, 'custom bracketed matrix'),
      customMatrix('matrix', false, true, 'custom row'),
      customMatrix('matrix', true, false, 'custom column'),
      customMatrix('matrix', true, true, 'custom matrix'),
      matrixTemplate('rightbrace', 2, 2, 'right-braced system', 'r'),
      matrixTemplate('cases', 2, 2, 'cases'),
    ];

    const FONTS = block(`
\\mathbb{R}|ℝ|R
\\mathbb{N}|ℕ|N
\\mathbb{Z}|ℤ|Z
\\mathbb{Q}|ℚ|Q
\\mathbb{C}|ℂ|C
\\mathbb{P}|ℙ|P
\\mathbb{H}|ℍ|H
\\mathcal{A}|𝒜|cal A
\\mathcal{B}|ℬ|cal B
\\mathcal{F}|ℱ|cal F
\\mathcal{L}|ℒ|cal L
\\mathcal{M}|ℳ|cal M
\\mathfrak{A}|𝔄|frak A
\\mathfrak{B}|𝔅|frak B
\\mathfrak{g}|𝔤|frak g
\\mathbf{v}|𝐯|bold v
\\boldsymbol{\\alpha}|𝜶|bold alpha
\\mathrm{d}|d|upright d
\\mathit{x}|x|italic x
\\mathsf{T}|𝖳|sans T
\\mathtt{x}|𝚡|mono x
\\text{text}|text|text
\\operatorname{arg}|arg|operator
\\mathscr{A}|𝒜|scr A
\\mathscr{H}|ℋ|scr H
\\mathbb{J}|𝕁|J
\\mathbb{L}|𝕃|L
\\mathbb{B}|𝔹|B
\\mathcal{E}|ℰ|cal E
\\mathcal{G}|𝒢|cal G
\\mathcal{K}|𝒦|cal K
\\mathcal{Z}|𝒵|cal Z
\\mathscr{F}|ℱ|scr F
\\mathscr{L}|ℒ|scr L
\\mathscr{O}|𝒪|scr O
\\mathscr{Z}|𝒵|scr Z
`);

    // AxMath's Greek palette is a four-row, ten-column grid. Keep the larger
    // lookup above for parsing manually typed LaTeX, but only show the entries
    // actually present in the local AxMath palette, in its displayed order.
    const GREEK_BY_NAME = new Map(GREEK.map((item) => [item.name, item]));
    const AXMATH_GREEK = [
      'alpha', 'beta', 'chi', 'delta', 'epsilon', 'varepsilon', 'phi', 'varphi', 'gamma', 'eta',
      'iota', 'kappa', 'lambda', 'mu', 'nu', 'pi', 'varpi', 'theta', 'vartheta', 'rho',
      'varrho', 'sigma', 'varsigma', 'tau', 'upsilon', 'omega', 'xi', 'psi', 'zeta', 'varDelta',
      'varPhi', 'varGamma', 'varLambda', 'varPi', 'varTheta', 'varSigma', 'varOmega', 'varXi', 'varPsi', 'varUpsilon',
    ].map((name) => GREEK_BY_NAME.get(name));

    // Local AxMath 2.5 operator IDs, in the expanded palette's order.
    const AXMATH_OPERATORS = [
      sym("+", "+", "plus"), // 0
      sym("-", "−", "minus"), // 1
      sym("\\cdot", "⋅", "cdot"), // 2
      sym("\\times", "×", "times"), // 3
      sym("\\pm", "±", "pm"), // 4
      sym("\\mp", "∓", "mp"), // 5
      sym("\\div", "÷", "div"), // 6
      sym("=", "=", "equals"), // 7
      sym("\\simeq", "≃", "simeq"), // 8
      sym("\\cong", "≅", "cong"), // 9
      sym("\\sim", "∼", "sim"), // 10
      sym("\\approx", "≈", "approx"), // 11
      sym("\\doteq", "≐", "doteq"), // 12
      sym("\\equiv", "≡", "equiv"), // 13
      sym("\\mathrel{\\overset{\\wedge}{=}}", "≙", "wedge above equals"), // 14
      sym("\\triangleq", "≜", "triangleq"), // 15
      sym("\\ne", "≠", "ne"), // 16
      sym("\\propto", "∝", "propto"), // 17
      sym("<", "<", "less than"), // 18
      sym(">", ">", "greater than"), // 19
      sym("\\leqslant", "⩽", "leqslant"), // 20
      sym("\\geqslant", "⩾", "geqslant"), // 21
      sym("\\ll", "≪", "ll"), // 22
      sym("\\gg", "≫", "gg"), // 23
      sym("\\prec", "≺", "prec"), // 24
      sym("\\succ", "≻", "succ"), // 25
      sym("\\lhd", "⊲", "lhd"), // 26
      sym("\\rhd", "⊳", "rhd"), // 27
      sym("\\oplus", "⊕", "oplus"), // 28
      sym("\\otimes", "⊗", "otimes"), // 29
      sym("\\odot", "⊙", "odot"), // 30
      sym("\\oslash", "⊘", "oslash"), // 31
      sym("\\subset", "⊂", "subset"), // 32
      sym("\\cap", "∩", "cap"), // 33
      sym("\\supset", "⊃", "supset"), // 34
      sym("\\cup", "∪", "cup"), // 35
      sym("\\nsubset", "⊄", "nsubset"), // 36
      sym("\\subseteq", "⊆", "subseteq"), // 37
      sym("\\supseteq", "⊇", "supseteq"), // 38
      sym("\\forall", "∀", "forall"), // 39
      sym("\\in", "∈", "in"), // 40
      sym("\\notin", "∉", "not in"), // 41
      sym("\\owns", "∋", "owns"), // 42
      sym("\\exists", "∃", "exists"), // 43
      sym("\\Cup", "⋓", "Cup"), // 44
      sym("\\Cap", "⋒", "Cap"), // 45
      sym("\\uplus", "⊎", "uplus"), // 46
      sym("\\lnot", "¬", "lnot"), // 47
      sym("\\because", "∵", "because"), // 48
      sym("\\therefore", "∴", "therefore"), // 49
      sym("\\land", "∧", "land"), // 50
      sym("\\lor", "∨", "lor"), // 51
      sym("\\bot", "⊥", "bot"), // 52
      sym("\\parallel", "∥", "parallel"), // 53
      sym("\\angle", "∠", "angle"), // 54
      sym("\\measuredangle", "∡", "measuredangle"), // 55
      sym("\\mathrel{\\text{▱}}", "▱", "parallelogram"), // 56
      sym("\\Box", "□", "Box"), // 57
      sym("\\mathrel{\\text{▭}}", "▭", "rectangle"), // 58
      sym("\\bigcirc", "○", "circle"), // 59
      sym("\\bigtriangleup", "△", "bigtriangleup"), // 60
      sym("\\Diamond", "◇", "Diamond"), // 61
      sym("\\mathrel{\\text{∿}}", "∿", "sine curve"), // 62
      tpl('\\mathrel{\\overset{\\text{∿}}{=}}', '\\mathrel{\\overset{\\text{∿}}{=}}', 'sine curve above equals'), // 63
      sym("\\cdots", "⋯", "cdots"), // 64
      sym("\\vdots", "⋮", "vdots"), // 65
      sym("\\ddots", "⋱", "ddots"), // 66
      sym("\\mathinner{\\text{⋰}}", "⋰", "rising diagonal dots"), // 67
      sym("\\circledast", "⊛", "circledast"), // 68
      sym("\\ominus", "⊖", "ominus"), // 69
      sym("\\circledcirc", "⊚", "circledcirc"), // 70
      sym("\\oslash", "⊘", "small circled slash"), // 71
      sym("\\leq", "≤", "leq"), // 72
      sym("\\geq", "≥", "geq"), // 73
      sym("\\preceq", "⪯", "preceq"), // 74
      sym("\\succeq", "⪰", "succeq"), // 75
      sym("\\sqsubseteq", "⊑", "sqsubseteq"), // 76
      sym("\\sqsupseteq", "⊒", "sqsupseteq"), // 77
      sym("\\smile", "⌣", "smile"), // 78
      sym("\\frown", "⌢", "frown"), // 79
      sym("\\models", "⊨", "models"), // 80
      sym("\\mid", "∣", "mid"), // 81
      sym("\\parallel", "∥", "parallel"), // 82
      sym("\\vdash", "⊢", "vdash"), // 83
      sym("\\dashv", "⊣", "dashv"), // 84
      sym("\\asymp", "≍", "asymp"), // 85
      sym("\\sqsubset", "⊏", "sqsubset"), // 86
      sym("\\sqsupset", "⊐", "sqsupset"), // 87
      sym("\\bowtie", "⋈", "bowtie"), // 88
      sym("\\Join", "⋈", "Join"), // 89
      sym("\\leqq", "≦", "leqq"), // 90
      sym("\\geqq", "≧", "geqq"), // 91
      sym("\\eqslantless", "⪕", "eqslantless"), // 92
      sym("\\eqslantgtr", "⪖", "eqslantgtr"), // 93
      sym("\\lesssim", "≲", "lesssim"), // 94
      sym("\\gtrsim", "≳", "gtrsim"), // 95
      sym("\\lessapprox", "⪅", "lessapprox"), // 96
      sym("\\gtrapprox", "⪆", "gtrapprox"), // 97
      sym("\\approxeq", "≊", "approxeq"), // 98
      sym("\\lessdot", "⋖", "lessdot"), // 99
      sym("\\gtrdot", "⋗", "gtrdot"), // 100
      sym("\\lll", "⋘", "lll"), // 101
      sym("\\ggg", "⋙", "ggg"), // 102
      sym("\\lessgtr", "≶", "lessgtr"), // 103
      sym("\\gtrless", "≷", "gtrless"), // 104
      sym("\\lesseqgtr", "⋚", "lesseqgtr"), // 105
      sym("\\gtreqless", "⋛", "gtreqless"), // 106
      sym("\\lesseqqgtr", "⪋", "lesseqqgtr"), // 107
      sym("\\gtreqqless", "⪌", "gtreqqless"), // 108
      sym("\\doteqdot", "≑", "doteqdot"), // 109
      sym("\\eqcirc", "≖", "eqcirc"), // 110
      sym("\\circeq", "≗", "circeq"), // 111
      sym("\\risingdotseq", "≓", "risingdotseq"), // 112
      sym("\\fallingdotseq", "≒", "fallingdotseq"), // 113
      sym("\\backsim", "∽", "backsim"), // 114
      sym("\\thicksim", "∼", "thicksim"), // 115
      sym("\\backsimeq", "⋍", "backsimeq"), // 116
      sym("\\thickapprox", "≈", "thickapprox"), // 117
      sym("\\preccurlyeq", "≼", "preccurlyeq"), // 118
      sym("\\succcurlyeq", "≽", "succcurlyeq"), // 119
      sym("\\curlyeqprec", "⋞", "curlyeqprec"), // 120
      sym("\\curlyeqsucc", "⋟", "curlyeqsucc"), // 121
      sym("\\precsim", "≾", "precsim"), // 122
      sym("\\succsim", "≿", "succsim"), // 123
      sym("\\precapprox", "⪷", "precapprox"), // 124
      sym("\\succapprox", "⪸", "succapprox"), // 125
      sym("\\subseteqq", "⫅", "subseteqq"), // 126
      sym("\\supseteqq", "⫆", "supseteqq"), // 127
      sym("\\Subset", "⋐", "Subset"), // 128
      sym("\\Supset", "⋑", "Supset"), // 129
      sym("\\trianglelefteq", "⊴", "trianglelefteq"), // 130
      sym("\\trianglerighteq", "⊵", "trianglerighteq"), // 131
      sym("\\vDash", "⊨", "vDash"), // 132
      sym("\\Vdash", "⊩", "Vdash"), // 133
      sym("\\Vvdash", "⊪", "Vvdash"), // 134
      sym("\\smallsmile", "⌣", "smallsmile"), // 135
      sym("\\smallfrown", "⌢", "smallfrown"), // 136
      sym("\\shortmid", "∣", "shortmid"), // 137
      sym("\\shortparallel", "∥", "shortparallel"), // 138
      sym("\\bumpeq", "≏", "bumpeq"), // 139
      sym("\\Bumpeq", "≎", "Bumpeq"), // 140
      sym("\\nexists", "∄", "nexists"), // 141
      sym("\\nless", "≮", "nless"), // 142
      sym("\\ngtr", "≯", "ngtr"), // 143
      sym("\\nleqslant", "≰", "nleqslant"), // 144
      sym("\\ngeqslant", "≱", "ngeqslant"), // 145
      sym("\\nprec", "⊀", "nprec"), // 146
      sym("\\nsucc", "⊁", "nsucc"), // 147
      sym("\\ntriangleleft", "⋪", "ntriangleleft"), // 148
      sym("\\ntriangleright", "⋫", "ntriangleright"), // 149
      sym("\\nsubseteq", "⊈", "nsubseteq"), // 150
      sym("\\nsupseteq", "⊉", "nsupseteq"), // 151
      sym("\\subsetneq", "⊊", "subsetneq"), // 152
      sym("\\supsetneq", "⊋", "supsetneq"), // 153
      sym("\\varsubsetneq", "⊊", "varsubsetneq"), // 154
      sym("\\varsupsetneq", "⊋", "varsupsetneq"), // 155
      sym("\\nleq", "≰", "nleq"), // 156
      sym("\\ngeq", "≱", "ngeq"), // 157
      sym("\\lneq", "⪇", "lneq"), // 158
      sym("\\gneq", "⪈", "gneq"), // 159
      sym("\\npreceq", "⋠", "npreceq"), // 160
      sym("\\nsucceq", "⋡", "nsucceq"), // 161
      sym("\\nmid", "∤", "nmid"), // 162
      sym("\\nparallel", "∦", "nparallel"), // 163
      sym("\\nvdash", "⊬", "nvdash"), // 164
      sym("\\nleqq", "≰", "nleqq"), // 165
      sym("\\ngeqq", "≱", "ngeqq"), // 166
      sym("\\lneqq", "≨", "lneqq"), // 167
      sym("\\gneqq", "≩", "gneqq"), // 168
      sym("\\lvertneqq", "≨", "lvertneqq"), // 169
      sym("\\gvertneqq", "≩", "gvertneqq"), // 170
      sym("\\lnsim", "⋦", "lnsim"), // 171
      sym("\\gnsim", "⋧", "gnsim"), // 172
      sym("\\lnapprox", "⪉", "lnapprox"), // 173
      sym("\\gnapprox", "⪊", "gnapprox"), // 174
      sym("\\ncong", "≇", "ncong"), // 175
      sym("\\nsim", "≁", "nsim"), // 176
      sym("\\napprox", "≉", "napprox"), // 177
      sym("\\precnsim", "⋨", "precnsim"), // 178
      sym("\\succnsim", "⋩", "succnsim"), // 179
      sym("\\precnapprox", "⪹", "precnapprox"), // 180
      sym("\\succnapprox", "⪺", "succnapprox"), // 181
      sym("\\precneqq", "⪵", "precneqq"), // 182
      sym("\\succneqq", "⪶", "succneqq"), // 183
      sym("\\nsubseteqq", "⊈", "nsubseteqq"), // 184
      sym("\\nsupseteqq", "⊉", "nsupseteqq"), // 185
      sym("\\subsetneqq", "⫋", "subsetneqq"), // 186
      sym("\\supsetneqq", "⫌", "supsetneqq"), // 187
      sym("\\varsubsetneqq", "⫋", "varsubsetneqq"), // 188
      sym("\\varsupsetneqq", "⫌", "varsupsetneqq"), // 189
      sym("\\ntrianglelefteq", "⋬", "ntrianglelefteq"), // 190
      sym("\\ntrianglerighteq", "⋭", "ntrianglerighteq"), // 191
      sym("\\nvDash", "⊭", "nvDash"), // 192
      sym("\\nVdash", "⊮", "nVdash"), // 193
      sym("\\nVDash", "⊯", "nVDash"), // 194
      sym("\\nshortmid", "∤", "nshortmid"), // 195
      sym("\\nshortparallel", "∦", "nshortparallel"), // 196
      sym("\\bullet", "•", "bullet"), // 197
      sym("\\sqcap", "⊓", "sqcap"), // 198
      sym("\\sqcup", "⊔", "sqcup"), // 199
      sym("\\circ", "∘", "circ"), // 200
      sym("\\bigcirc", "◯", "bigcirc"), // 201
      sym("\\diamond", "⋄", "diamond"), // 202
      sym("\\ast", "∗", "ast"), // 203
      sym("\\wr", "≀", "wr"), // 204
      sym("\\dotplus", "∔", "dotplus"), // 205
      sym("\\ltimes", "⋉", "ltimes"), // 206
      sym("\\rtimes", "⋊", "rtimes"), // 207
      sym("\\leftthreetimes", "⋋", "leftthreetimes"), // 208
      sym("\\rightthreetimes", "⋌", "rightthreetimes"), // 209
      sym("\\circleddash", "⊝", "circleddash"), // 210
      sym("\\barwedge", "⊼", "barwedge"), // 211
      sym("\\veebar", "⊻", "veebar"), // 212
      sym("\\doublebarwedge", "⩞", "doublebarwedge"), // 213
      sym("\\curlywedge", "⋏", "curlywedge"), // 214
      sym("\\curlyvee", "⋎", "curlyvee"), // 215
      sym("\\boxplus", "⊞", "boxplus"), // 216
      sym("\\boxminus", "⊟", "boxminus"), // 217
      sym("\\boxtimes", "⊠", "boxtimes"), // 218
      sym("\\boxdot", "⊡", "boxdot"), // 219
      sym("\\divideontimes", "⋇", "divideontimes"), // 220
      sym("\\diagdown", "╲", "diagdown"), // 221
      sym("\\diagup", "╱", "diagup"), // 222
      sym("\\setminus", "∖", "setminus"), // 223
      sym("\\smallsetminus", "∖", "smallsetminus"), // 224
      sym("\\pitchfork", "⋔", "pitchfork"), // 225
      sym("\\bigtriangledown", "▽", "bigtriangledown"), // 226
      sym("\\vartriangle", "△", "vartriangle"), // 227
      sym("\\triangledown", "▽", "triangledown"), // 228
      sym("\\vartriangleleft", "⊲", "vartriangleleft"), // 229
      sym("\\vartriangleright", "⊳", "vartriangleright"), // 230
      sym("\\triangleleft", "◁", "triangleleft"), // 231
      sym("\\triangleright", "▷", "triangleright"), // 232
      sym("\\sphericalangle", "∢", "sphericalangle"), // 233
      sym("\\eqsim", "≂", "eqsim"), // 234
      sym("\\top", "⊤", "top"), // 235
      sym("\\parallelequal", "⫲", "parallelequal"), // 236
      sym("\\mathinner{\\text{‥}}", "‥", "two horizontal dots"), // 237
      sym(":", ":", "two vertical dots"), // 238
    ];
    const AXMATH_OPERATOR_PINS = [
      0, 4, 11, 19, 23, 39, 25, 28, 68, 35, 37, 48, 60, 62, 142, 146, 158, 206,
      1, 5, 12, 18, 22, 40, 24, 69, 70, 33, 38, 49, 56, 63, 143, 147, 159, 207,
      3, 2, 13, 21, 50, 41, 47, 29, 71, 32, 152, 59, 53, 54, 150, 36, 180, 220,
      6, 7, 16, 20, 51, 43, 89, 30, 46, 34, 153, 57, 52, 236, 151, 175, 181,
    ].map((id) => AXMATH_OPERATORS[id]).filter(Boolean);

    // Build the body, side-limit and stacked-limit forms used by AxMath.
    function operationTemplate(command, variant, name) {
      const modifier = variant === 'side' ? '\\nolimits' : variant.startsWith('stack') ? '\\limits' : '';
      const lowerOnly = variant === 'lower' || variant === 'stackLower';
      const suffix = variant === 'body' ? '{@}' : lowerOnly ? '_{@}{}' : '_{@}^{}{}';
      const preview = variant === 'body' ? '{□}' : lowerOnly ? '_{□}{□}' : '_{□}^{□}{□}';
      return tpl(command + modifier + suffix, command + modifier + preview, name + ' (' + variant + ')');
    }

    const AXMATH_INTEGRAL_BASES = [
      ['\\int', 'integral'], ['\\oint', 'contour integral'],
      ['\\ointclockwise', 'clockwise contour integral'], ['\\ointctrclockwise', 'counterclockwise contour integral'],
      ['\\iint', 'double integral'], ['\\oiint', 'closed surface integral'],
      ['\\iiint', 'triple integral'], ['\\oiiint', 'closed volume integral'],
      ['\\iiiint', 'quadruple integral'], ['\\int\\cdots\\int', 'multiple integral'],
    ];
    const AXMATH_INTEGRALS = [
      ...['body', 'lower', 'limits', 'stackLower', 'stackBoth'].flatMap((variant) =>
        (variant === 'body' || variant === 'lower' ? AXMATH_INTEGRAL_BASES :
          [AXMATH_INTEGRAL_BASES[0], AXMATH_INTEGRAL_BASES[1], AXMATH_INTEGRAL_BASES[3], AXMATH_INTEGRAL_BASES[2],
            ...AXMATH_INTEGRAL_BASES.slice(4)])
          .map(([command, name]) => operationTemplate(command, variant, name))),
    ];
    const AXMATH_INTEGRAL_PINS = [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20,
    ].map((id) => AXMATH_INTEGRALS[id]).filter(Boolean);

    const AXMATH_BIGOP_BASES = [
      ['\\sum', 'sum'], ['\\prod', 'product'], ['\\coprod', 'coproduct'],
      ['\\bigcap', 'intersection'], ['\\bigcup', 'union'], ['\\bigvee', 'big or'],
      ['\\bigwedge', 'big and'], ['\\bigsqcup', 'square union'], ['\\biguplus', 'disjoint union'],
      ['\\bigotimes', 'tensor product'], ['\\bigodot', 'big odot'], ['\\bigoplus', 'direct sum'],
    ];
    const AXMATH_BIGOPS = [
      ...['body', 'stackBoth', 'stackLower', 'side'].flatMap((variant) =>
        AXMATH_BIGOP_BASES.map(([command, name]) => operationTemplate(command, variant, name))),
      tpl('{}_{}^{}\\mathop{@}\\nolimits_{}^{}', '{}_{□}^{□}\\mathop{□}\\nolimits_{□}^{□}', 'operator with scripts on both sides'),
    ];
    const AXMATH_BIGOP_PINS = AXMATH_BIGOPS.slice(0, 29).filter(Boolean);

    // The indices follow AxMath's root, fraction, script and spacing group.
    const AXMATH_ROOTS = [
      tpl('\\sqrt{@}', '\\sqrt{□}', 'square root'),
      tpl('\\frac{@}{}', '\\frac{□}{□}', 'fraction'),
      tpl('^{@}', '□^{□}', 'superscript'),
      tpl('\\overset{@}{}', '\\overset{□}{□}', 'overset'),
      tpl('_{@}', '□_{□}', 'subscript'),
      { ...tpl('\\!', 'a\\!b', 'negative thin space'), rootIcon: { kind: 'space', label: '−3', gap: 0 } },
      { ...tpl('\\!\\:', 'a\\!\\:b', 'one eighteenth em'), rootIcon: { kind: 'space', label: '1', gap: 3 } },
      { ...tpl('\\,', 'a\\,b', 'thin space'), rootIcon: { kind: 'space', label: '3', gap: 5 } },
      { ...tpl('\\:', 'a\\:b', 'medium space'), rootIcon: { kind: 'space', label: '4', gap: 7 } },
      tpl('\\sqrt[@]{}', '\\sqrt[□]{□}', 'indexed root'),
      tpl('{@}/{}', '□/□', 'linear fraction'),
      tpl('_{@}^{}', '□_{□}^{□}', 'subscript and superscript'),
      tpl('\\underset{@}{\\overset{}{}}', '\\underset{□}{\\overset{□}{□}}', 'over and under'),
      tpl('\\mid_{@}^{}', '\\mid_{□}^{□}', 'bar with scripts'),
      { ...tpl('\\;', 'a\\;b', 'thick space'), rootIcon: { kind: 'space', label: '5', gap: 9 } },
      { ...tpl('\\quad', 'a\\quad b', 'one em'), rootIcon: { kind: 'space', label: '1M', gap: 11 } },
      { ...tpl('\\qquad', 'a\\qquad b', 'two em'), rootIcon: { kind: 'space', label: '2M', gap: 13 } },
      { ...tpl('\\hspace{@1em}', 'a\\hspace{1em}b', 'custom space'), rootIcon: { kind: 'space', label: 'xM', gap: 12, dashed: true } },
      tpl('{}\\overset{@}{\\overline{){}}}', '□\\overset{□}{\\overline{)□}}', 'long division'),
      tpl('{}^{@}/{}_{}', '{}^{□}/{}_{□}', 'diagonal fraction'),
      tpl('_{@}', '□_{□}', 'subscript'),
      tpl('\\underset{@}{}', '\\underset{□}{□}', 'underscript'),
      tpl('\\underset{@}{\\_}', '\\underset{□}{\\_}', 'underbar script'),
      { ...tpl('\\phantom{@}', '\\text{□→⬚}', 'phantom'), rootIcon: { kind: 'phantom', mode: 'both' } },
      { ...tpl('\\hphantom{@}', '\\text{□→⬚h}', 'horizontal phantom'), rootIcon: { kind: 'phantom', mode: 'h' } },
      { ...tpl('\\vphantom{@}', '\\text{□→⬚v}', 'vertical phantom'), rootIcon: { kind: 'phantom', mode: 'v' } },
      null, // Restoring phantom is an editor action, not an insertable symbol.
    ];

    const AXMATH_ACCENT_ABOVE = [
      ['\\dot', '\\cdot'], ['\\ddot', '\\cdot\\cdot'], ['\\vec', '\\rightarrow'],
      ['\\overleftrightarrow', '\\leftrightarrow'], ['\\overleftarrow', '\\leftarrow'],
      ['\\tilde', '\\sim'], ['\\hat', '\\wedge'], ['\\widehat', '\\wedge'], ['\\overgroup', '\\frown'],
      ['\\bar', '-'], ['\\grave', '\\text{`}'], ['\\dddot', '\\cdot\\cdot\\cdot'],
      ['\\ddddot', '\\cdot\\cdot\\cdot\\cdot'], ['\\overrightharpoon', '\\rightharpoonup'],
      ['\\overleftrightarrow', '\\leftrightarrow'], ['\\overleftharpoon', '\\leftharpoonup'],
      ['\\widetilde', '\\sim'], ['\\check', '\\vee'], ['\\widecheck', '\\vee'], ['\\breve', '\\smile'],
      ['\\mathring', '\\circ'], ['\\acute', "\\text{'}"],
    ];
    const AXMATH_SMALL_ACCENTS = [
      ...AXMATH_ACCENT_ABOVE.map((entry) => entry === null ? null :
        tpl(entry[0] + '{@}', entry[0] + '{□}', entry[0].slice(1) + ' above')),
      ...AXMATH_ACCENT_ABOVE.map((entry) => entry === null ? null :
        tpl('\\underset{' + entry[1] + '}{@}', '\\underset{' + entry[1] + '}{□}', entry[0].slice(1) + ' below')),
    ];
    const AXMATH_WIDE_ACCENTS = [
      ['\\overgroup{@}', 'overgroup'], ['\\widetilde{@}', 'wide tilde'], ['\\overbracket{@}', 'overbracket'],
      ['\\widehat{@}', 'wide hat'], ['\\overrightarrow{@}', 'right arrow above'],
      ['\\overleftrightarrow{@}', 'left-right arrow above'], ['\\overleftarrow{@}', 'left arrow above'],
      ['\\overrightharpoon{@}', 'right harpoon above'], ['\\overbrace{@}', 'overbrace'],
      ['\\overline{@}', 'overline'], ['\\overline{\\overline{@}}', 'double overline'],
      ['\\overbracket{@}', 'top bracket'],

      ['\\undergroup{@}', 'undergroup'], ['\\utilde{@}', 'tilde below'], ['\\underbracket{@}', 'underbracket'],
      ['\\underset{\\vee}{@}', 'wide check below'], ['\\underrightarrow{@}', 'right arrow below'],
      ['\\underleftrightarrow{@}', 'left-right arrow below'], ['\\underleftarrow{@}', 'left arrow below'],
      ['\\underset{\\rightharpoonup}{@}', 'right harpoon below'], ['\\underbrace{@}', 'underbrace'],
      ['\\underline{@}', 'underline'], ['\\underline{\\underline{@}}', 'double underline'],
      ['\\underbracket{@}', 'bottom bracket'],

      ['\\sout{@}', 'horizontal strike'], ['\\bcancel{@}', 'descending strike'],
      ['\\cancel{@}', 'ascending strike'], ['\\xcancel{@}', 'cross out'],
      ['\\ulcorner\\overline{@}', 'top-left frame'],
      ['\\llcorner\\underline{@}', 'bottom-left frame'],
      ['\\underline{@}\\lrcorner', 'bottom-right frame'],
      ['\\overline{@}\\urcorner', 'top-right frame'],
      ['\\boxed{@}', 'box'], ['\\colorbox{lightgray}{@}', 'shaded box'],
      null, null, // Patterned backgrounds have no standard character representation.

      ['\\overset{\\curvearrowright}{@}', 'clockwise arrow above'],
      ['\\underset{\\curvearrowright}{@}', 'clockwise arrow below'],
      ['\\overset{\\curvearrowleft}{@}', 'counterclockwise arrow above'],
      ['\\underset{\\curvearrowleft}{@}', 'counterclockwise arrow below'],
      ['\\ulcorner\\overline{@}\\downarrow', 'top frame, down arrow on right'],
      ['\\llcorner\\underline{@}\\uparrow', 'bottom frame, up arrow on right'],
      ['\\downarrow\\overline{@}\\urcorner', 'top frame, down arrow on left'],
      ['\\uparrow\\underline{@}\\lrcorner', 'bottom frame, up arrow on left'],
      ['\\overbracket{@}^{}', 'overbracket with label'], ['\\underbracket{@}_{}', 'underbracket with label'],
      ['\\overbrace{@}^{}', 'overbrace with label'], ['\\underbrace{@}_{}', 'underbrace with label'],
    ].map((entry) => entry === null ? null : tpl(entry[0], entry[0].replace('@', '□').replace(/(\^|_)\{\}$/, '$1{□}'), entry[1]));
    const AXMATH_WIDE_ACCENT_PINS = AXMATH_WIDE_ACCENTS.slice(0, 23).filter(Boolean);

    // Paired and one-sided delimiters in the order of the local AxMath panel.
    // Nested ordinary brackets are used for double square brackets because
    // the host KaTeX renderer does not accept AxMath's \Lbrack as a delimiter.
    const AXMATH_DELIMITERS = [
      ['\\left(@\\right)', 'parentheses'],
      ['\\left[@\\right]', 'square brackets'],
      ['\\left\\{@\\right\\}', 'braces'],
      ['\\left\\langle @\\right\\rangle', 'angle brackets'],
      ['\\left|@\\right|', 'absolute value'],
      ['\\left\\lVert @\\right\\rVert', 'norm'],
      ['\\left\\lfloor @\\right\\rfloor', 'floor'],
      ['\\left\\lceil @\\right\\rceil', 'ceiling'],
      ['\\left[\\!\\left[@\\right]\\!\\right]', 'double square brackets'],
      ['\\left[@\\right[', 'left-facing square brackets'],
      ['\\left]@\\right]', 'right-facing square brackets'],
      ['\\left]@\\right[', 'outward square brackets'],
      ['\\left(@\\right]', 'left parenthesis, right bracket'],
      ['\\left[@\\right)', 'left bracket, right parenthesis'],
      ['\\left\\langle @\\right|', 'left angle, right bar'],
      ['\\left|@\\right\\rangle', 'left bar, right angle'],
      ['\\left(@\\right.', 'left parenthesis'],
      ['\\left.@\\right)', 'right parenthesis'],
      ['\\left[@\\right.', 'left square bracket'],
      ['\\left.@\\right]', 'right square bracket'],
      ['\\left\\{@\\right.', 'left brace'],
      ['\\left.@\\right\\}', 'right brace'],
      ['\\left\\langle @\\right.', 'left angle bracket'],
      ['\\left.@\\right\\rangle', 'right angle bracket'],
      ['\\left|@\\right.', 'left bar'],
      ['\\left.@\\right|', 'right bar'],
      ['\\left\\lVert @\\right.', 'left double bar'],
      ['\\left.@\\right\\rVert', 'right double bar'],
      ['\\left[\\!\\left[@\\right.\\right.', 'left double square bracket'],
      ['\\left.\\left.@\\right]\\!\\right]', 'right double square bracket'],
      ['\\left[@\\mid{}\\right]', 'bracket with divider'],
      ['\\left\\langle @\\mid{}\\right\\rangle', 'angle brackets with divider'],
    ].map(([latex, name]) => tpl(latex, latex.replace('@', '□'), name));

    // Special-character IDs from the local AxMath palette. Null entries are
    // the non-Unicode logos and the custom-symbol editor action.
    const AXMATH_SPECIAL = [
      sym("\\degree", "°", "character 0"), // 0
      sym("\\partial", "∂", "character 1"), // 1
      sym("\\mho", "℧", "character 2"), // 2
      sym("ƛ", "ƛ", "character 3"), // 3
      sym("\\text{§}", "§", "character 4"), // 4
      sym("\\prime", "′", "character 5"), // 5
      sym("\\propto", "∝", "character 6"), // 6
      sym("\\infty", "∞", "character 7"), // 7
      sym("\\hbar", "ℏ", "character 8"), // 8
      sym("\\dagger", "†", "character 9"), // 9
      sym("\\imath", "ı", "character 10"), // 10
      sym("\\prime\\prime", "″", "character 11"), // 11
      sym("\\nabla", "∇", "character 12"), // 12
      sym("\\eth", "ð", "character 13"), // 13
      sym("\\ell", "ℓ", "character 14"), // 14
      sym("\\ddagger", "‡", "character 15"), // 15
      sym("\\jmath", "ȷ", "character 16"), // 16
      sym("\\prime\\prime\\prime", "‴", "character 17"), // 17
      sym("\\aleph", "ℵ", "character 18"), // 18
      sym("\\Im", "ℑ", "character 19"), // 19
      sym("\\Re", "ℜ", "character 20"), // 20
      sym("\\wp", "℘", "character 21"), // 21
      sym("\\varkappa", "ϰ", "character 22"), // 22
      sym("\\backepsilon", "϶", "character 23"), // 23
      sym("\\text{€}", "€", "character 24"), // 24
      sym("\\text{£}", "£", "character 25"), // 25
      sym("\\text{¥}", "¥", "character 26"), // 26
      sym("\\text{©}", "©", "character 27"), // 27
      sym("\\text{®}", "®", "character 28"), // 28
      sym("\\text{¶}", "¶", "character 29"), // 29
      sym("\\eth", "ð", "eth variant"), // 30
      sym("\\text{‵}", "‵", "character 31"), // 31
      sym("\\%", "%", "character 32"), // 32
      sym("\\text{‰}", "‰", "character 33"), // 33
      sym("\\text{✋}", "✋", "raised hand"), // 34
      sym("\\mathbb{A}", "𝔸", "\\mathbb{A}"), // 35
      sym("\\mathbb{B}", "𝔹", "\\mathbb{B}"), // 36
      sym("\\mathbb{C}", "ℂ", "\\mathbb{C}"), // 37
      sym("\\mathbb{D}", "𝔻", "\\mathbb{D}"), // 38
      sym("\\mathbb{E}", "𝔼", "\\mathbb{E}"), // 39
      sym("\\mathbb{F}", "𝔽", "\\mathbb{F}"), // 40
      sym("\\mathbb{G}", "𝔾", "\\mathbb{G}"), // 41
      sym("\\mathbb{H}", "ℍ", "\\mathbb{H}"), // 42
      sym("\\mathbb{I}", "𝕀", "\\mathbb{I}"), // 43
      sym("\\mathbb{J}", "𝕁", "\\mathbb{J}"), // 44
      sym("\\mathbb{K}", "𝕂", "\\mathbb{K}"), // 45
      sym("\\mathbb{L}", "𝕃", "\\mathbb{L}"), // 46
      sym("\\mathbb{M}", "𝕄", "\\mathbb{M}"), // 47
      sym("\\mathbb{N}", "ℕ", "\\mathbb{N}"), // 48
      sym("\\mathbb{O}", "𝕆", "\\mathbb{O}"), // 49
      sym("\\mathbb{P}", "ℙ", "\\mathbb{P}"), // 50
      sym("\\mathbb{Q}", "ℚ", "\\mathbb{Q}"), // 51
      sym("\\mathbb{R}", "ℝ", "\\mathbb{R}"), // 52
      sym("\\mathbb{S}", "𝕊", "\\mathbb{S}"), // 53
      sym("\\mathbb{T}", "𝕋", "\\mathbb{T}"), // 54
      sym("\\mathbb{U}", "𝕌", "\\mathbb{U}"), // 55
      sym("\\mathbb{V}", "𝕍", "\\mathbb{V}"), // 56
      sym("\\mathbb{W}", "𝕎", "\\mathbb{W}"), // 57
      sym("\\mathbb{X}", "𝕏", "\\mathbb{X}"), // 58
      sym("\\mathbb{Y}", "𝕐", "\\mathbb{Y}"), // 59
      sym("\\mathbb{Z}", "ℤ", "\\mathbb{Z}"), // 60
      sym("\\Bbbk", "𝕜", "\\Bbbk"), // 61
      sym("\\imath", "ı", "\\imath"), // 62
      sym("\\jmath", "ȷ", "\\jmath"), // 63
      sym("\\mathbf{k}", "𝐤", "\\mathbf{k}"), // 64
      sym("\\mathscr{A}", "𝒜", "\\mathscr{A}"), // 65
      sym("\\mathscr{B}", "ℬ", "\\mathscr{B}"), // 66
      sym("\\mathscr{C}", "𝒞", "\\mathscr{C}"), // 67
      sym("\\mathscr{D}", "𝒟", "\\mathscr{D}"), // 68
      sym("\\mathscr{E}", "ℰ", "\\mathscr{E}"), // 69
      sym("\\mathscr{F}", "ℱ", "\\mathscr{F}"), // 70
      sym("\\mathscr{G}", "𝒢", "\\mathscr{G}"), // 71
      sym("\\mathscr{H}", "ℋ", "\\mathscr{H}"), // 72
      sym("\\mathscr{I}", "ℐ", "\\mathscr{I}"), // 73
      sym("\\mathscr{J}", "𝒥", "\\mathscr{J}"), // 74
      sym("\\mathscr{K}", "𝒦", "\\mathscr{K}"), // 75
      sym("\\mathscr{L}", "ℒ", "\\mathscr{L}"), // 76
      sym("\\mathscr{M}", "ℳ", "\\mathscr{M}"), // 77
      sym("\\mathscr{N}", "𝒩", "\\mathscr{N}"), // 78
      sym("\\mathscr{O}", "𝒪", "\\mathscr{O}"), // 79
      sym("\\mathscr{P}", "𝒫", "\\mathscr{P}"), // 80
      sym("\\mathscr{Q}", "𝒬", "\\mathscr{Q}"), // 81
      sym("\\mathscr{R}", "ℛ", "\\mathscr{R}"), // 82
      sym("\\mathscr{S}", "𝒮", "\\mathscr{S}"), // 83
      sym("\\mathscr{T}", "𝒯", "\\mathscr{T}"), // 84
      sym("\\mathscr{U}", "𝒰", "\\mathscr{U}"), // 85
      sym("\\mathscr{V}", "𝒱", "\\mathscr{V}"), // 86
      sym("\\mathscr{W}", "𝒲", "\\mathscr{W}"), // 87
      sym("\\mathscr{X}", "𝒳", "\\mathscr{X}"), // 88
      sym("\\mathscr{Y}", "𝒴", "\\mathscr{Y}"), // 89
      sym("\\mathscr{Z}", "𝒵", "\\mathscr{Z}"), // 90
      sym("\\mathcal{A}", "𝒜", "\\mathcal{A}"), // 91
      sym("\\mathcal{B}", "ℬ", "\\mathcal{B}"), // 92
      sym("\\mathcal{C}", "𝒞", "\\mathcal{C}"), // 93
      sym("\\mathcal{D}", "𝒟", "\\mathcal{D}"), // 94
      sym("\\mathcal{E}", "ℰ", "\\mathcal{E}"), // 95
      sym("\\mathcal{F}", "ℱ", "\\mathcal{F}"), // 96
      sym("\\mathcal{G}", "𝒢", "\\mathcal{G}"), // 97
      sym("\\mathcal{H}", "ℋ", "\\mathcal{H}"), // 98
      sym("\\mathcal{I}", "ℐ", "\\mathcal{I}"), // 99
      sym("\\mathcal{J}", "𝒥", "\\mathcal{J}"), // 100
      sym("\\mathcal{K}", "𝒦", "\\mathcal{K}"), // 101
      sym("\\mathcal{L}", "ℒ", "\\mathcal{L}"), // 102
      sym("\\mathcal{M}", "ℳ", "\\mathcal{M}"), // 103
      sym("\\mathcal{N}", "𝒩", "\\mathcal{N}"), // 104
      sym("\\mathcal{O}", "𝒪", "\\mathcal{O}"), // 105
      sym("\\mathcal{P}", "𝒫", "\\mathcal{P}"), // 106
      sym("\\mathcal{Q}", "𝒬", "\\mathcal{Q}"), // 107
      sym("\\mathcal{R}", "ℛ", "\\mathcal{R}"), // 108
      sym("\\mathcal{S}", "𝒮", "\\mathcal{S}"), // 109
      sym("\\mathcal{T}", "𝒯", "\\mathcal{T}"), // 110
      sym("\\mathcal{U}", "𝒰", "\\mathcal{U}"), // 111
      sym("\\mathcal{V}", "𝒱", "\\mathcal{V}"), // 112
      sym("\\mathcal{W}", "𝒲", "\\mathcal{W}"), // 113
      sym("\\mathcal{X}", "𝒳", "\\mathcal{X}"), // 114
      sym("\\mathcal{Y}", "𝒴", "\\mathcal{Y}"), // 115
      sym("\\mathcal{Z}", "𝒵", "\\mathcal{Z}"), // 116
      sym("\\mathfrak{A}", "𝔄", "\\mathfrak{A}"), // 117
      sym("\\mathfrak{B}", "𝔅", "\\mathfrak{B}"), // 118
      sym("\\mathfrak{C}", "ℭ", "\\mathfrak{C}"), // 119
      sym("\\mathfrak{D}", "𝔇", "\\mathfrak{D}"), // 120
      sym("\\mathfrak{E}", "𝔈", "\\mathfrak{E}"), // 121
      sym("\\mathfrak{F}", "𝔉", "\\mathfrak{F}"), // 122
      sym("\\mathfrak{G}", "𝔊", "\\mathfrak{G}"), // 123
      sym("\\mathfrak{H}", "ℌ", "\\mathfrak{H}"), // 124
      sym("\\mathfrak{I}", "ℑ", "\\mathfrak{I}"), // 125
      sym("\\mathfrak{J}", "𝔍", "\\mathfrak{J}"), // 126
      sym("\\mathfrak{K}", "𝔎", "\\mathfrak{K}"), // 127
      sym("\\mathfrak{L}", "𝔏", "\\mathfrak{L}"), // 128
      sym("\\mathfrak{M}", "𝔐", "\\mathfrak{M}"), // 129
      sym("\\mathfrak{N}", "𝔑", "\\mathfrak{N}"), // 130
      sym("\\mathfrak{O}", "𝔒", "\\mathfrak{O}"), // 131
      sym("\\mathfrak{P}", "𝔓", "\\mathfrak{P}"), // 132
      sym("\\mathfrak{Q}", "𝔔", "\\mathfrak{Q}"), // 133
      sym("\\mathfrak{R}", "ℜ", "\\mathfrak{R}"), // 134
      sym("\\mathfrak{S}", "𝔖", "\\mathfrak{S}"), // 135
      sym("\\mathfrak{T}", "𝔗", "\\mathfrak{T}"), // 136
      sym("\\mathfrak{U}", "𝔘", "\\mathfrak{U}"), // 137
      sym("\\mathfrak{V}", "𝔙", "\\mathfrak{V}"), // 138
      sym("\\mathfrak{W}", "𝔚", "\\mathfrak{W}"), // 139
      sym("\\mathfrak{X}", "𝔛", "\\mathfrak{X}"), // 140
      sym("\\mathfrak{Y}", "𝔜", "\\mathfrak{Y}"), // 141
      sym("\\mathfrak{Z}", "ℨ", "\\mathfrak{Z}"), // 142
      sym("\\mathfrak{a}", "𝔞", "\\mathfrak{a}"), // 143
      sym("\\mathfrak{b}", "𝔟", "\\mathfrak{b}"), // 144
      sym("\\mathfrak{c}", "𝔠", "\\mathfrak{c}"), // 145
      sym("\\mathfrak{d}", "𝔡", "\\mathfrak{d}"), // 146
      sym("\\mathfrak{e}", "𝔢", "\\mathfrak{e}"), // 147
      sym("\\mathfrak{f}", "𝔣", "\\mathfrak{f}"), // 148
      sym("\\mathfrak{g}", "𝔤", "\\mathfrak{g}"), // 149
      sym("\\mathfrak{h}", "𝔥", "\\mathfrak{h}"), // 150
      sym("\\mathfrak{i}", "𝔦", "\\mathfrak{i}"), // 151
      sym("\\mathfrak{j}", "𝔧", "\\mathfrak{j}"), // 152
      sym("\\mathfrak{k}", "𝔨", "\\mathfrak{k}"), // 153
      sym("\\mathfrak{l}", "𝔩", "\\mathfrak{l}"), // 154
      sym("\\mathfrak{m}", "𝔪", "\\mathfrak{m}"), // 155
      sym("\\mathfrak{n}", "𝔫", "\\mathfrak{n}"), // 156
      sym("\\mathfrak{o}", "𝔬", "\\mathfrak{o}"), // 157
      sym("\\mathfrak{p}", "𝔭", "\\mathfrak{p}"), // 158
      sym("\\mathfrak{q}", "𝔮", "\\mathfrak{q}"), // 159
      sym("\\mathfrak{r}", "𝔯", "\\mathfrak{r}"), // 160
      sym("\\mathfrak{s}", "𝔰", "\\mathfrak{s}"), // 161
      sym("\\mathfrak{t}", "𝔱", "\\mathfrak{t}"), // 162
      sym("\\mathfrak{u}", "𝔲", "\\mathfrak{u}"), // 163
      sym("\\mathfrak{v}", "𝔳", "\\mathfrak{v}"), // 164
      sym("\\mathfrak{w}", "𝔴", "\\mathfrak{w}"), // 165
      sym("\\mathfrak{x}", "𝔵", "\\mathfrak{x}"), // 166
      sym("\\mathfrak{y}", "𝔶", "\\mathfrak{y}"), // 167
      sym("\\mathfrak{z}", "𝔷", "\\mathfrak{z}"), // 168
      sym("\\eth", "ð", "\\eth"), // 169
      sym("\\aleph", "ℵ", "\\aleph"), // 170
      sym("\\Im", "ℑ", "\\Im"), // 171
      sym("\\Re", "ℜ", "\\Re"), // 172
      sym("\\wp", "℘", "\\wp"), // 173
      sym("\\mathscr{B}", "ℬ", "\\mathscr{B}"), // 174
      sym("\\mathscr{H}", "ℋ", "\\mathscr{H}"), // 175
      sym("\\mathscr{I}", "ℐ", "\\mathscr{I}"), // 176
      sym("\\mathscr{L}", "ℒ", "\\mathscr{L}"), // 177
      sym("\\mathscr{R}", "ℛ", "\\mathscr{R}"), // 178
      sym("\\mathscr{E}", "ℰ", "\\mathscr{E}"), // 179
      sym("\\mathscr{F}", "ℱ", "\\mathscr{F}"), // 180
      sym("\\text{⓪}", "⓪", "\\text{⓪}"), // 181
      sym("\\text{①}", "①", "\\text{①}"), // 182
      sym("\\text{②}", "②", "\\text{②}"), // 183
      sym("\\text{③}", "③", "\\text{③}"), // 184
      sym("\\text{④}", "④", "\\text{④}"), // 185
      sym("\\text{⑤}", "⑤", "\\text{⑤}"), // 186
      sym("\\text{⑥}", "⑥", "\\text{⑥}"), // 187
      sym("\\text{⑦}", "⑦", "\\text{⑦}"), // 188
      sym("\\text{⑧}", "⑧", "\\text{⑧}"), // 189
      sym("\\text{⑨}", "⑨", "\\text{⑨}"), // 190
      sym("\\text{⑩}", "⑩", "\\text{⑩}"), // 191
      sym("\\lozenge", "◊", "\\lozenge"), // 192
      sym("\\blacklozenge", "⧫", "\\blacklozenge"), // 193
      sym("\\amalg", "⨿", "\\amalg"), // 194
      sym("\\ni", "∋", "contains as member"), // 195
      sym("\\Finv", "Ⅎ", "\\Finv"), // 196
      sym("\\Game", "⅁", "\\Game"), // 197
      sym("\\digamma", "ϝ", "\\digamma"), // 198
      sym("\\beth", "ℶ", "\\beth"), // 199
      sym("\\gimel", "ℷ", "\\gimel"), // 200
      sym("\\daleth", "ℸ", "\\daleth"), // 201
      sym("\\between", "≬", "\\between"), // 202
      sym("\\intercal", "⊺", "\\intercal"), // 203
      sym("\\eth", "ð", "\\eth"), // 204
      sym("\\star", "⋆", "\\star"), // 205
      sym("\\bigstar", "★", "\\bigstar"), // 206
      sym("\\emptyset", "∅", "\\emptyset"), // 207
      sym("\\varnothing", "∅", "\\varnothing"), // 208
      sym("\\smallint", "∫", "\\smallint"), // 209
      sym("\\text{¶}", "¶", "\\text{¶}"), // 210
      sym("\\flat", "♭", "\\flat"), // 211
      sym("\\natural", "♮", "\\natural"), // 212
      sym("\\sharp", "♯", "\\sharp"), // 213
      sym("\\blacktriangle", "▲", "\\blacktriangle"), // 214
      sym("\\blacktriangledown", "▼", "\\blacktriangledown"), // 215
      sym("\\blacktriangleright", "▶", "\\blacktriangleright"), // 216
      sym("\\blacktriangleleft", "◀", "\\blacktriangleleft"), // 217
      sym("\\maltese", "✠", "\\maltese"), // 218
      sym("\\clubsuit", "♣", "\\clubsuit"), // 219
      sym("\\diamondsuit", "♢", "\\diamondsuit"), // 220
      sym("\\heartsuit", "♡", "\\heartsuit"), // 221
      sym("\\spadesuit", "♠", "\\spadesuit"), // 222
      sym("\\surd", "√", "\\surd"), // 223
      sym("\\text{¥}", "¥", "\\text{¥}"), // 224
      sym("\\text{£}", "£", "\\text{£}"), // 225
      sym("\\text{€}", "€", "\\text{€}"), // 226
      sym("\\circledR", "®", "\\circledR"), // 227
      sym("\\circledS", "Ⓢ", "\\circledS"), // 228
      sym("\\blacksquare", "■", "\\blacksquare"), // 229
      sym("\\complement", "∁", "\\complement"), // 230
      sym("\\boldsymbol{\\mathscr{A}}", "𝓐", "\\boldsymbol{\\mathscr{A}}"), // 231
      sym("\\boldsymbol{\\mathscr{B}}", "𝓑", "\\boldsymbol{\\mathscr{B}}"), // 232
      sym("\\boldsymbol{\\mathscr{C}}", "𝓒", "\\boldsymbol{\\mathscr{C}}"), // 233
      sym("\\boldsymbol{\\mathscr{D}}", "𝓓", "\\boldsymbol{\\mathscr{D}}"), // 234
      sym("\\boldsymbol{\\mathscr{E}}", "𝓔", "\\boldsymbol{\\mathscr{E}}"), // 235
      sym("\\boldsymbol{\\mathscr{F}}", "𝓕", "\\boldsymbol{\\mathscr{F}}"), // 236
      sym("\\boldsymbol{\\mathscr{G}}", "𝓖", "\\boldsymbol{\\mathscr{G}}"), // 237
      sym("\\boldsymbol{\\mathscr{H}}", "𝓗", "\\boldsymbol{\\mathscr{H}}"), // 238
      sym("\\boldsymbol{\\mathscr{I}}", "𝓘", "\\boldsymbol{\\mathscr{I}}"), // 239
      sym("\\boldsymbol{\\mathscr{J}}", "𝓙", "\\boldsymbol{\\mathscr{J}}"), // 240
      sym("\\boldsymbol{\\mathscr{K}}", "𝓚", "\\boldsymbol{\\mathscr{K}}"), // 241
      sym("\\boldsymbol{\\mathscr{L}}", "𝓛", "\\boldsymbol{\\mathscr{L}}"), // 242
      sym("\\boldsymbol{\\mathscr{M}}", "𝓜", "\\boldsymbol{\\mathscr{M}}"), // 243
      sym("\\boldsymbol{\\mathscr{N}}", "𝓝", "\\boldsymbol{\\mathscr{N}}"), // 244
      sym("\\boldsymbol{\\mathscr{O}}", "𝓞", "\\boldsymbol{\\mathscr{O}}"), // 245
      sym("\\boldsymbol{\\mathscr{P}}", "𝓟", "\\boldsymbol{\\mathscr{P}}"), // 246
      sym("\\boldsymbol{\\mathscr{Q}}", "𝓠", "\\boldsymbol{\\mathscr{Q}}"), // 247
      sym("\\boldsymbol{\\mathscr{R}}", "𝓡", "\\boldsymbol{\\mathscr{R}}"), // 248
      sym("\\boldsymbol{\\mathscr{S}}", "𝓢", "\\boldsymbol{\\mathscr{S}}"), // 249
      sym("\\boldsymbol{\\mathscr{T}}", "𝓣", "\\boldsymbol{\\mathscr{T}}"), // 250
      sym("\\boldsymbol{\\mathscr{U}}", "𝓤", "\\boldsymbol{\\mathscr{U}}"), // 251
      sym("\\boldsymbol{\\mathscr{V}}", "𝓥", "\\boldsymbol{\\mathscr{V}}"), // 252
      sym("\\boldsymbol{\\mathscr{W}}", "𝓦", "\\boldsymbol{\\mathscr{W}}"), // 253
      sym("\\boldsymbol{\\mathscr{X}}", "𝓧", "\\boldsymbol{\\mathscr{X}}"), // 254
      sym("\\boldsymbol{\\mathscr{Y}}", "𝓨", "\\boldsymbol{\\mathscr{Y}}"), // 255
      sym("\\boldsymbol{\\mathscr{Z}}", "𝓩", "\\boldsymbol{\\mathscr{Z}}"), // 256
      sym("\\text{🕊}", "🕊", "dove"), // 257
      sym("\\text{☺}", "☺", "\\text{☺}"), // 258
      sym("\\text{☯}", "☯", "\\text{☯}"), // 259
      sym("\\text{✿}", "✿", "\\text{✿}"), // 260
      null, // 261: Windows logo has no standard character
      null, // 262: Apple logo has no standard character
      sym("\\text{✘}", "✘", "\\text{✘}"), // 263
      sym("\\checkmark", "✓", "\\checkmark"), // 264
      sym("\\text{�}", "�", "replacement character"), // 265
      null, // 266: AxMath's custom-symbol editor is an action, not a symbol
    ];
    const AXMATH_SPECIAL_PINS = [
      0, 1, 12, 8, 10, 18, 208, 264, 181, 185, 51, 37, 72, 174, 95, 116,
      5, 7, 6, 3, 16, 19, 230, 263, 182, 186, 52, 61, 76, 175, 97, 117,
      11, 2, 9, 30, 22, 20, 207, 29, 183, 187, 48, 65, 79, 176, 101, 118,
      17, 33, 15, 14, 202, 21, 220, 201, 184, 188, 60, 70, 90, 177, 266,
    ].map((id) => AXMATH_SPECIAL[id]).filter(Boolean);

    function opposingHarpoons(longRight) {
      const top = longRight ? '\\xrightharpoonup{}' : '\\rightharpoonup';
      const bottom = longRight ? '\\leftharpoondown' : '\\xleftharpoondown{}';
      const align = longRight ? 'l' : 'r';
      return '\\mathrel{\\begin{array}{' + align + '}' + top + ' \\\\ ' + bottom + '\\end{array}}';
    }
    const HARPOONS_LONG_RIGHT = opposingHarpoons(true);
    const HARPOONS_LONG_LEFT = opposingHarpoons(false);

    // Arrow IDs in the local AxMath palette, with KaTeX-compatible equivalents.
    const AXMATH_ARROWS = [
      sym("\\leftarrow", "←", "leftarrow"), // 0
      sym("\\uparrow", "↑", "uparrow"), // 1
      sym("\\rightarrow", "→", "rightarrow"), // 2
      sym("\\downarrow", "↓", "downarrow"), // 3
      sym("\\leftrightarrow", "↔", "leftrightarrow"), // 4
      sym("\\updownarrow", "↕", "updownarrow"), // 5
      sym("\\nwarrow", "↖", "nwarrow"), // 6
      sym("\\nearrow", "↗", "nearrow"), // 7
      sym("\\searrow", "↘", "searrow"), // 8
      sym("\\swarrow", "↙", "swarrow"), // 9
      sym("\\mapsto", "↦", "mapsto"), // 10
      sym("\\hookleftarrow", "↩", "hookleftarrow"), // 11
      sym("\\hookrightarrow", "↪", "hookrightarrow"), // 12
      sym("\\leftharpoonup", "↼", "leftharpoonup"), // 13
      sym("\\leftharpoondown", "↽", "leftharpoondown"), // 14
      sym("\\rightharpoonup", "⇀", "rightharpoonup"), // 15
      sym("\\rightharpoondown", "⇁", "rightharpoondown"), // 16
      sym("\\rightleftharpoons", "⇌", "rightwards harpoon over leftwards harpoon"), // 17
      sym("\\Leftarrow", "⇐", "Leftarrow"), // 18
      sym("\\Uparrow", "⇑", "Uparrow"), // 19
      sym("\\Rightarrow", "⇒", "Rightarrow"), // 20
      sym("\\Downarrow", "⇓", "Downarrow"), // 21
      sym("\\Leftrightarrow", "⇔", "Leftrightarrow"), // 22
      sym("\\Updownarrow", "⇕", "Updownarrow"), // 23
      sym("\\longleftarrow", "⟵", "longleftarrow"), // 24
      sym("\\longrightarrow", "⟶", "longrightarrow"), // 25
      sym("\\longleftrightarrow", "⟷", "longleftrightarrow"), // 26
      sym("\\Longleftarrow", "⟸", "Longleftarrow"), // 27
      sym("\\Longrightarrow", "⟹", "Longrightarrow"), // 28
      sym("\\Longleftrightarrow", "⟺", "Longleftrightarrow"), // 29
      sym("\\longmapsto", "⟼", "longmapsto"), // 30
      sym("\\mathrel{\\text{⬅}}", "⬅", "bold left arrow"), // 31
      sym("\\mathrel{\\text{➡}}", "➡", "bold right arrow"), // 32
      sym("\\nleftarrow", "↚", "nleftarrow"), // 33
      sym("\\nrightarrow", "↛", "nrightarrow"), // 34
      sym("\\twoheadleftarrow", "↞", "twoheadleftarrow"), // 35
      sym("\\twoheadrightarrow", "↠", "twoheadrightarrow"), // 36
      sym("\\leftarrowtail", "↢", "leftarrowtail"), // 37
      sym("\\rightarrowtail", "↣", "rightarrowtail"), // 38
      sym("\\looparrowright", "↬", "looparrowright"), // 39
      sym("\\looparrowleft", "↫", "looparrowleft"), // 40
      sym("\\leftrightsquigarrow", "↭", "leftrightsquigarrow"), // 41
      sym("\\nleftrightarrow", "↮", "nleftrightarrow"), // 42
      sym("\\Lsh", "↰", "Lsh"), // 43
      sym("\\Rsh", "↱", "Rsh"), // 44
      sym("\\curvearrowleft", "↶", "curvearrowleft"), // 45
      sym("\\curvearrowright", "↷", "curvearrowright"), // 46
      sym("\\circlearrowleft", "↺", "circlearrowleft"), // 47
      sym("\\circlearrowright", "↻", "circlearrowright"), // 48
      sym("\\upharpoonright", "↾", "upharpoonright"), // 49
      sym("\\upharpoonleft", "↿", "upharpoonleft"), // 50
      sym("\\downharpoonright", "⇂", "downharpoonright"), // 51
      sym("\\downharpoonleft", "⇃", "down harpoon left"), // 52
      sym("\\rightleftarrows", "⇄", "rightleftarrows"), // 53
      sym("\\leftrightarrows", "⇆", "leftrightarrows"), // 54
      sym("\\leftleftarrows", "⇇", "leftleftarrows"), // 55
      sym("\\upuparrows", "⇈", "upuparrows"), // 56
      sym("\\rightrightarrows", "⇉", "rightrightarrows"), // 57
      sym("\\downdownarrows", "⇊", "downdownarrows"), // 58
      sym("\\leftrightharpoons", "⇋", "leftrightharpoons"), // 59
      sym("\\rightleftharpoons", "⇌", "rightleftharpoons"), // 60
      sym("\\nLeftarrow", "⇍", "nLeftarrow"), // 61
      sym("\\nLeftrightarrow", "⇎", "nLeftrightarrow"), // 62
      sym("\\nRightarrow", "⇏", "nRightarrow"), // 63
      sym("\\Lleftarrow", "⇚", "Lleftarrow"), // 64
      sym("\\Rrightarrow", "⇛", "Rrightarrow"), // 65
      sym("\\rightsquigarrow", "⇝", "rightsquigarrow"), // 66
      sym("\\dashleftarrow", "⇠", "dashleftarrow"), // 67
      sym("\\dashrightarrow", "⇢", "dashrightarrow"), // 68
      sym("\\boldsymbol{\\uparrow}", "↑", "upwards arrow"), // 69
      sym("\\boldsymbol{\\downarrow}", "↓", "downwards arrow"), // 70
      sym("\\boldsymbol{\\Uparrow}", "⇑", "upwards double arrow"), // 71
      sym("\\boldsymbol{\\Downarrow}", "⇓", "downwards double arrow"), // 72
      sym("\\multimap", "⊸", "multimap"), // 73
      sym("\\leadsto", "↝", "leadsto"), // 74
      sym("\\mathrel{\\text{«}}", "«", "double left angle"), // 75
      sym("\\mathrel{\\text{»}}", "»", "double right angle"), // 76
      sym("\\mathrel{\\text{➡}}", "➡", "black rightwards arrow"), // 77
      sym("\\mathrel{\\text{⬅}}", "⬅", "leftwards black arrow"), // 78
      sym("\\mathrel{\\text{⬆}}", "⬆", "upwards black arrow"), // 79
      sym("\\mathrel{\\text{⬇}}", "⬇", "downwards black arrow"), // 80
      sym("\\text{👍}", "👍", "thumbs up sign"), // 81
      sym("\\text{👎}", "👎", "thumbs down sign"), // 82
      tpl("\\overset{\\nearrow}{\\searrow}", "\\overset{\\nearrow}{\\searrow}", "paired arrows 83"), // 83
      tpl("\\overset{\\searrow}{\\nearrow}", "\\overset{\\searrow}{\\nearrow}", "paired arrows 84"), // 84
      tpl("\\overset{\\rightarrow}{\\searrow}", "\\overset{\\rightarrow}{\\searrow}", "paired arrows 85"), // 85
      tpl("\\overset{\\searrow}{\\searrow}", "\\overset{\\searrow}{\\searrow}", "paired arrows 86"), // 86
      tpl("\\overset{\\nearrow}{\\nearrow}", "\\overset{\\nearrow}{\\nearrow}", "paired arrows 87"), // 87
      tpl("\\overset{\\searrow}{\\rightarrow}", "\\overset{\\searrow}{\\rightarrow}", "paired arrows 88"), // 88
      tpl("\\overset{\\uparrow}{\\odot}", "\\overset{\\uparrow}{\\odot}", "paired arrows 89"), // 89
      tpl("\\rightleftarrows", "\\rightleftarrows", "paired arrows 90"), // 90
      tpl("\\overset{\\longrightarrow}{\\leftarrow}", "\\overset{\\longrightarrow}{\\leftarrow}", "paired arrows 91"), // 91
      tpl("\\overset{\\rightarrow}{\\longleftarrow}", "\\overset{\\rightarrow}{\\longleftarrow}", "paired arrows 92"), // 92
      tpl("\\rightleftharpoons", "\\rightleftharpoons", "paired arrows 93"), // 93
      tpl(HARPOONS_LONG_RIGHT, HARPOONS_LONG_RIGHT, "paired arrows 94"), // 94
      tpl(HARPOONS_LONG_LEFT, HARPOONS_LONG_LEFT, "paired arrows 95"), // 95
      sym("\\mathrel{\\text{↻}}", "↻", "clockwise open circle arrow"), // 96
      sym("\\mathrel{\\text{↺}}", "↺", "anticlockwise open circle arrow"), // 97
      sym("\\mathrel{\\text{↶}}", "↶", "anticlockwise top semicircle arrow"), // 98
      sym("\\mathrel{\\text{⤴}}", "⤴", "arrow pointing rightwards then curving upwards"), // 99
      sym("\\mathrel{\\text{⤷}}", "⤷", "arrow pointing downwards then curving rightwards"), // 100
      sym("\\mathrel{\\text{⤶}}", "⤶", "arrow pointing downwards then curving leftwards"), // 101
      sym("\\mathrel{\\text{⟲}}", "⟲", "anticlockwise gapped circle arrow"), // 102
      sym("\\mathrel{\\text{⇦}}", "⇦", "leftwards white arrow"), // 103
      sym("\\mathrel{\\text{⇨}}", "⇨", "rightwards white arrow"), // 104
      sym("\\mathrel{\\text{⇧}}", "⇧", "upwards white arrow"), // 105
      sym("\\mathrel{\\text{⇩}}", "⇩", "downwards white arrow"), // 106
      sym("\\mathrel{\\text{⬄}}", "⬄", "left right white arrow"), // 107
      sym("\\mathrel{\\text{⇳}}", "⇳", "up down white arrow"), // 108
      sym("\\mathrel{\\text{↲}}", "↲", "downwards arrow with tip leftwards"), // 109
      sym("\\mathrel{\\text{↳}}", "↳", "downwards arrow with tip rightwards"), // 110
      sym("\\mathrel{\\text{↰}}", "↰", "upwards arrow with tip leftwards"), // 111
      sym("\\mathrel{\\text{↱}}", "↱", "upwards arrow with tip rightwards"), // 112
      sym("\\mathrel{\\text{🡸}}", "🡸", "wide-headed leftwards heavy barb arrow"), // 113
      sym("\\mathrel{\\text{🡺}}", "🡺", "wide-headed rightwards heavy barb arrow"), // 114
      sym("\\mathrel{\\text{🡹}}", "🡹", "wide-headed upwards heavy barb arrow"), // 115
      sym("\\mathrel{\\text{🡻}}", "🡻", "wide-headed downwards heavy barb arrow"), // 116
      sym("\\mathrel{\\text{🡼}}", "🡼", "wide-headed north west heavy barb arrow"), // 117
      sym("\\mathrel{\\text{🡽}}", "🡽", "wide-headed north east heavy barb arrow"), // 118
      sym("\\mathrel{\\text{🡿}}", "🡿", "wide-headed south west heavy barb arrow"), // 119
      sym("\\mathrel{\\text{🡾}}", "🡾", "wide-headed south east heavy barb arrow"), // 120
      sym("\\mathrel{\\text{⭧}}", "⭧", "north east triangle-headed arrow"), // 121
      sym("\\mathrel{\\text{→}}", "→", "rightwards arrow"), // 122
      sym("\\mathrel{\\text{↗}}", "↗", "north east arrow"), // 123
      sym("\\mathrel{\\text{↑}}", "↑", "upwards arrow"), // 124
      sym("\\mathrel{\\text{↖}}", "↖", "north west arrow"), // 125
      sym("\\mathrel{\\text{←}}", "←", "leftwards arrow"), // 126
      sym("\\mathrel{\\text{↙}}", "↙", "south west arrow"), // 127
      sym("\\mathrel{\\text{↓}}", "↓", "downwards arrow"), // 128
      sym("\\mathrel{\\text{↘}}", "↘", "south east arrow"), // 129
      sym("\\mathrel{\\text{↔}}", "↔", "left right arrow"), // 130
      sym("\\mathrel{\\text{⤢}}", "⤢", "north east and south west arrow"), // 131
      sym("\\mathrel{\\text{↕}}", "↕", "up down arrow"), // 132
      sym("\\mathrel{\\text{⤡}}", "⤡", "north west and south east arrow"), // 133
      sym("\\mathrel{\\text{⇒}}", "⇒", "rightwards double arrow"), // 134
      sym("\\mathrel{\\text{⇐}}", "⇐", "leftwards double arrow"), // 135
      sym("\\mathrel{\\text{⇓}}", "⇓", "downwards double arrow"), // 136
      sym("\\mathrel{\\text{⇑}}", "⇑", "upwards double arrow"), // 137
      sym("\\mathrel{\\text{⇔}}", "⇔", "left right double arrow"), // 138
      sym("\\mathrel{\\text{⇕}}", "⇕", "up down double arrow"), // 139
      tpl("\\rightleftarrows", "\\rightleftarrows", "paired arrows 140"), // 140
      sym("\\mathrel{\\text{⥂}}", "⥂", "right arrow above short left arrow"), // 141
      sym("\\mathrel{\\text{⥄}}", "⥄", "short right arrow above left arrow"), // 142
      tpl("\\rightleftharpoons", "\\rightleftharpoons", "opposing harpoons"), // 143
      tpl(HARPOONS_LONG_RIGHT, HARPOONS_LONG_RIGHT, "long right harpoon above short left harpoon"), // 144
      tpl(HARPOONS_LONG_LEFT, HARPOONS_LONG_LEFT, "short right harpoon above long left harpoon"), // 145
      sym("\\mathrel{\\text{↦}}", "↦", "rightwards arrow from bar"), // 146
      sym("\\mapsfrom", "↤", "leftwards arrow from bar"), // 147
      sym("\\mathrel{\\text{↪}}", "↪", "rightwards arrow with hook"), // 148
      sym("\\mathrel{\\text{↩}}", "↩", "leftwards arrow with hook"), // 149
      sym("\\mathrel{\\text{⬰}}", "⬰", "left arrow with small circle"), // 150
      sym("\\mathrel{\\text{⇴}}", "⇴", "right arrow with small circle"), // 151
      sym("\\mathrel{\\text{⧬}}", "⧬", "white circle with down arrow"), // 152
      sym("\\mathrel{\\text{⦽}}", "⦽", "up arrow through circle"), // 153
      sym("\\mathrel{\\text{⇝}}", "⇝", "rightwards squiggle arrow"), // 154
      sym("\\mathrel{\\text{⬳}}", "⬳", "long leftwards squiggle arrow"), // 155
      sym("\\mathrel{\\text{↭}}", "↭", "left right wave arrow"), // 156
      sym("\\mathrel{\\text{↬}}", "↬", "rightwards arrow with loop"), // 157
      sym("\\mathrel{\\text{↫}}", "↫", "leftwards arrow with loop"), // 158
      sym("\\mathrel{\\text{⥈}}", "⥈", "left right arrow through small circle"), // 159
      sym("\\mathrel{\\text{↪}}", "↪", "rightwards arrow with hook"), // 160
      sym("\\mathrel{\\text{↩}}", "↩", "leftwards arrow with hook"), // 161
      tpl('\\xlongequal{@}', '\\xlongequal{□}', 'labelled equals'), // 162
      tpl('\\xrightarrow{@}', '\\xrightarrow{□}', 'labelled right arrow'), // 163
      tpl('\\xleftarrow{@}', '\\xleftarrow{□}', 'labelled left arrow'), // 164
      tpl('\\xleftrightarrow{@}', '\\xleftrightarrow{□}', 'labelled two-way arrow'), // 165
      tpl('\\xrightleftarrows{@}', '\\xrightleftarrows{□}', 'labelled opposing arrows'), // 166
      tpl('\\overset{@}{\\mathrel{\\text{⥂}}}', '\\overset{□}{\\mathrel{\\text{⥂}}}', 'labelled long right arrow above short left arrow'), // 167
      tpl('\\overset{@}{\\mathrel{\\text{⥄}}}', '\\overset{□}{\\mathrel{\\text{⥄}}}', 'labelled short right arrow above long left arrow'), // 168
      tpl('\\xrightleftharpoons{@}', '\\xrightleftharpoons{□}', 'labelled opposing harpoons'), // 169
      tpl('\\overset{@}{' + HARPOONS_LONG_RIGHT + '}', '\\overset{□}{' + HARPOONS_LONG_RIGHT + '}', 'labelled long right harpoon above short left harpoon'), // 170
      tpl('\\overset{@}{' + HARPOONS_LONG_LEFT + '}', '\\overset{□}{' + HARPOONS_LONG_LEFT + '}', 'labelled short right harpoon above long left harpoon'), // 171
      tpl("\\xRightarrow{@}", "\\xRightarrow{□}", "labelled arrow 172"), // 172
      tpl("\\xlongequal[@]{}", "\\xlongequal[□]{□}", "labelled arrow 173"), // 173
      tpl("\\xrightarrow[@]{}", "\\xrightarrow[□]{□}", "labelled arrow 174"), // 174
      tpl("\\xleftarrow[@]{}", "\\xleftarrow[□]{□}", "labelled arrow 175"), // 175
      tpl('\\xleftrightarrow[@]{}', '\\xleftrightarrow[□]{□}', 'two-way arrow with two labels'), // 176
      tpl('\\xrightleftarrows[@]{}', '\\xrightleftarrows[□]{□}', 'opposing arrows with two labels'), // 177
      tpl('\\overset{}{\\underset{@}{\\mathrel{\\text{⥂}}}}', '\\overset{□}{\\underset{□}{\\mathrel{\\text{⥂}}}}', 'long right arrow above short left arrow with two labels'), // 178
      tpl('\\overset{}{\\underset{@}{\\mathrel{\\text{⥄}}}}', '\\overset{□}{\\underset{□}{\\mathrel{\\text{⥄}}}}', 'short right arrow above long left arrow with two labels'), // 179
      tpl('\\xrightleftharpoons[@]{}', '\\xrightleftharpoons[□]{□}', 'opposing harpoons with two labels'), // 180
      tpl('\\overset{}{\\underset{@}{' + HARPOONS_LONG_RIGHT + '}}', '\\overset{□}{\\underset{□}{' + HARPOONS_LONG_RIGHT + '}}', 'long right harpoon above short left harpoon with two labels'), // 181
      tpl('\\overset{}{\\underset{@}{' + HARPOONS_LONG_LEFT + '}}', '\\overset{□}{\\underset{□}{' + HARPOONS_LONG_LEFT + '}}', 'short right harpoon above long left harpoon with two labels'), // 182
      tpl("\\xRightarrow[@]{}", "\\xRightarrow[□]{□}", "labelled arrow 183"), // 183
    ];
    const AXMATH_ARROW_PINS = [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
      16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
      32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 61, 62, 63, 45, 46,
      47, 48, 57, 55, 54, 53, 162, 163, 164, 165, 166, 169, 172, 176, 177,
    ].map((id) => AXMATH_ARROWS[id]).filter(Boolean);

    const CATEGORIES = [
      { id: 'greek', zh: '希腊字母', en: 'Greek', items: AXMATH_GREEK },
      { id: 'radical', zh: '根式与上下标', en: 'Roots and scripts', items: AXMATH_ROOTS.filter(Boolean) },
      { id: 'binary', zh: '运算符', en: 'Operators', items: AXMATH_OPERATOR_PINS, expandedItems: AXMATH_OPERATORS.filter(Boolean) },
      { id: 'special', zh: '特殊符号', en: 'Special symbols', items: AXMATH_SPECIAL_PINS, expandedItems: AXMATH_SPECIAL.filter(Boolean) },
      { id: 'smallaccent', zh: '字符修饰', en: 'Character accents', items: AXMATH_SMALL_ACCENTS.filter(Boolean) },
      { id: 'accent', zh: '上下修饰', en: 'Over and under accents', items: AXMATH_WIDE_ACCENT_PINS, expandedItems: AXMATH_WIDE_ACCENTS.filter(Boolean) },
      { id: 'bracket', zh: '括号', en: 'Delimiters', items: AXMATH_DELIMITERS },
      { id: 'integral', zh: '积分', en: 'Integrals', items: AXMATH_INTEGRAL_PINS, expandedItems: AXMATH_INTEGRALS.filter(Boolean) },
      { id: 'bigops', zh: '大型运算符', en: 'Big operators', items: AXMATH_BIGOP_PINS, expandedItems: AXMATH_BIGOPS.filter(Boolean) },
      { id: 'matrix', zh: '矩阵与向量', en: 'Matrices', items: AXMATH_MATRICES },
      { id: 'arrow', zh: '箭头', en: 'Arrows', items: AXMATH_ARROW_PINS, expandedItems: AXMATH_ARROWS.filter(Boolean) },
    ];

    const TAB = new Map(CATEGORIES.map((category) => [category.id, category]));

    /* =======================================================================
     * 2. LaTeX preview renderer
     *
     * A deliberately small LaTeX subset renderer: it understands what the
     * palette above can produce (fractions, roots, scripts, big operators,
     * delimiters, matrices, accents, fonts, text and spacing). Real math
     * stays authoritative in the transcript — the Harness markdown renderer
     * turns the inserted $…$ into KaTeX output there.
     * ===================================================================== */

    const SYMBOL_CHARS = Object.create(null);

    function registerSymbol(latex, ch) {
      const match = /^\\([a-zA-Z]+)$/.exec(latex);
      if (match === null) return;
      if (SYMBOL_CHARS[match[1]] === undefined) SYMBOL_CHARS[match[1]] = ch;
    }

    // Keep manually typed Greek commands working even when they are not
    // exposed as buttons in the AxMath palette.
    for (const item of GREEK.concat(BINARY, RELATION, BRACKET, SETS, FONTS, CALCULUS, ARROW, INTEGRAL_SYMBOLS, BIGOPS_SYMBOLS)) registerSymbol(item.latex, item.ch);
    for (const category of CATEGORIES) {
      for (const item of category.expandedItems || category.items) {
        if (item.kind === 'symbol') registerSymbol(item.latex, item.ch);
      }
    }

    Object.assign(SYMBOL_CHARS, {
      square: '□',
      ointclockwise: '∲',
      blacksquare: '■',
      cdots: '⋯',
      ldots: '…',
      dots: '…',
      vdots: '⋮',
      ddots: '⋱',
      colon: ':',
      prime: '′',
      backslash: '\\',
      '{': '{',
      '}': '}',
      '%': '%',
      '&': '&',
      '#': '#',
      _: '_',
      $: '$',
      ' ': ' ',
    });

    const VAR_GREEK_TO_UPRIGHT = {
      varDelta: '\\Delta',
      varPhi: '\\Phi',
      varGamma: '\\Gamma',
      varLambda: '\\Lambda',
      varPi: '\\Pi',
      varTheta: '\\Theta',
      varSigma: '\\Sigma',
      varOmega: '\\Omega',
      varXi: '\\Xi',
      varPsi: '\\Psi',
      varUpsilon: '\\Upsilon',
    };

    const UPRIGHT_GREEK_TO_VAR = {
      Delta: '\\varDelta',
      Phi: '\\varPhi',
      Gamma: '\\varGamma',
      Lambda: '\\varLambda',
      Pi: '\\varPi',
      Theta: '\\varTheta',
      Sigma: '\\varSigma',
      Omega: '\\varOmega',
      Xi: '\\varXi',
      Psi: '\\varPsi',
      Upsilon: '\\varUpsilon',
    };

    const LOWER_GREEK_CMD_TO_GLYPH = {
      alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ϵ', varepsilon: 'ε',
      zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ',
      varkappa: 'ϰ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', varpi: 'ϖ',
      rho: 'ρ', varrho: 'ϱ', sigma: 'σ', varsigma: 'ς', tau: 'τ', upsilon: 'υ',
      phi: 'ϕ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω', digamma: 'ϝ',
    };

    const LOWER_GREEK_GLYPH_TO_CMD = Object.create(null);
    for (const [cmd, glyph] of Object.entries(LOWER_GREEK_CMD_TO_GLYPH)) {
      if (LOWER_GREEK_GLYPH_TO_CMD[glyph] === undefined) {
        LOWER_GREEK_GLYPH_TO_CMD[glyph] = cmd;
      }
    }
    const UPRIGHT_GREEK_GLYPHS = new Set(Object.values(LOWER_GREEK_CMD_TO_GLYPH));

    const BIG_OPERATORS = new Set([
      'sum', 'prod', 'coprod', 'bigcup', 'bigcap', 'bigsqcup', 'bigsqcap',
      'bigvee', 'bigwedge', 'bigoplus', 'bigotimes', 'bigodot', 'biguplus', 'bigtimes',
      'lim', 'liminf', 'limsup', 'max', 'min', 'sup', 'inf', 'det', 'gcd', 'Pr',
    ]);

    const INTEGRALS = new Set([
      'int', 'iint', 'iiint', 'iiiint', 'oint', 'oiint', 'oiiint', 'smallint', 'intop',
      'fint', 'varointclockwise', 'ointclockwise', 'ointctrclockwise', 'sumint', 'intclockwise',
    ]);

    const FUNCTION_NAMES = new Set(FUNCTIONS.map((item) => item.name));

    const ACCENT_MARKS = {
      hat: 'ˆ',
      check: 'ˇ',
      breve: '˘',
      acute: '´',
      grave: '`',
      tilde: '˜',
      bar: '‾',
      vec: '→',
      dot: '˙',
      ddot: '¨',
      dddot: '⃛',
      ddddot: '····',
      mathring: '˚',
    };

    const LABELLED_ARROWS = {
      xlongequal: '═', xrightarrow: '⟶', xleftarrow: '⟵',
      xleftrightarrow: '⟷', xleftrightharpoons: '⇋', xrightleftarrows: '⇄',
      xrightleftharpoons: '⇌', xRightarrow: '⟹',
      xrightharpoonup: '⇀', xleftharpoondown: '↽',
    };

    const FONT_COMMANDS = {
      mathbb: 'mathbb',
      mathcal: 'mathcal',
      mathfrak: 'mathfrak',
      mathbf: 'mathbf',
      mathrm: 'mathrm',
      mathit: 'mathit',
      mathsf: 'mathsf',
      mathtt: 'mathtt',
      mathscr: 'mathcal',
      boldsymbol: 'mathbf',
      operatorname: 'mathrm',
    };

    const ALPHABETS = {
      mathbb: '𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫',
      mathcal: '𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏',
      mathfrak: '𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷',
    };

    function mapAlphabet(text, alphabet) {
      const characters = Array.from(alphabet);
      return Array.from(text)
        .map((ch) => {
          const code = ch.charCodeAt(0);
          let index = -1;
          if (code >= 65 && code <= 90) index = code - 65;
          else if (code >= 97 && code <= 122) index = 26 + (code - 97);
          if (index < 0 || index >= characters.length) return ch;
          return characters[index];
        })
        .join('');
    }

    const DELIMITER_CHARS = {
      '(': '(', ')': ')', '[': '[', ']': ']', '|': '|', '/': '/',
      '.': '', '<': '⟨', '>': '⟩',
      '{': '{', '}': '}', '\\': '\\',
      lbrace: '{', rbrace: '}', lbrack: '[', rbrack: ']',
      langle: '⟨', rangle: '⟩', lceil: '⌈', rceil: '⌉',
      lfloor: '⌊', rfloor: '⌋', lvert: '|', rvert: '|',
      vert: '|', Vert: '‖', lVert: '‖', rVert: '‖',
      '|': '‖',
      ulcorner: '⌜', urcorner: '⌝', llcorner: '⌞', lrcorner: '⌟',
      uparrow: '↑', downarrow: '↓', updownarrow: '↕',
      Uparrow: '⇑', Downarrow: '⇓', Updownarrow: '⇕',
      backslash: '\\',
    };

    const ALPHABETS_BOLDSCR = '𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩';

    function tokenize(source) {
      const tokens = [];
      let index = 0;
      while (index < source.length) {
        const ch = String.fromCodePoint(source.codePointAt(index));
        if (ch === '\\') {
          const word = /^[a-zA-Z]+/.exec(source.slice(index + 1));
          if (word !== null) {
            tokens.push({ t: 'cmd', v: word[0] });
            index += 1 + word[0].length;
          } else {
            const nextCh = index + 1 < source.length ? String.fromCodePoint(source.codePointAt(index + 1)) : '';
            tokens.push({ t: 'cmd', v: nextCh });
            index += 1 + (nextCh === '' ? 0 : nextCh.length);
          }
        } else if (ch === '{' || ch === '}') {
          tokens.push({ t: ch });
          index += 1;
        } else if (ch === '^' || ch === '_') {
          tokens.push({ t: ch });
          index += 1;
        } else if (ch === '&') {
          tokens.push({ t: '&' });
          index += 1;
        } else if (ch === ' ') {
          tokens.push({ t: 'space' });
          index += 1;
        } else if (ch === '\n' || ch === '\r' || ch === '\t') {
          index += 1;
        } else {
          tokens.push({ t: 'char', v: ch });
          index += ch.length;
        }
      }
      return tokens;
    }

    function parseLatex(source) {
      const state = { tokens: tokenize(source), index: 0 };
      return parseSequence(state);
    }

    function peek(state) {
      return state.tokens[state.index];
    }

    function parseSequence(state) {
      const nodes = [];
      while (state.index < state.tokens.length) {
        const token = state.tokens[state.index];
        if (token.t === '}' || token.t === '&') break;
        if (token.t === 'cmd' && (token.v === '\\' || token.v === 'end' || token.v === 'right')) break;
        if (token.t === 'cmd' && (token.v === 'limits' || token.v === 'nolimits')) {
          const base = nodes[nodes.length - 1];
          if (base && (base.type === 'bigop' || base.type === 'integral' || base.type === 'mathop')) {
            base.limits = token.v === 'nolimits' ? 'side' : 'stack';
          }
          state.index += 1;
          continue;
        }
        if (token.t === '^' || token.t === '_') {
          applyScript(state, nodes, token.t);
          continue;
        }
        nodes.push(parseAtom(state));
      }
      return nodes;
    }

    function parseAtom(state) {
      const token = state.tokens[state.index];
      state.index += 1;
      if (token === undefined) return { type: 'text', v: '' };
      if (token.t === '{') {
        const kids = parseSequence(state);
        if (peek(state) !== undefined && peek(state).t === '}') state.index += 1;
        return { type: 'group', kids };
      }
      if (token.t === 'char') return { type: 'text', v: token.v };
      if (token.t === 'space') return { type: 'space', w: '0.28em' };
      if (token.t === 'cmd') return parseCommand(state, token.v);
      return { type: 'text', v: '' };
    }

    function parseGroup(state) {
      if (peek(state) === undefined || peek(state).t !== '{') return [parseAtom(state)];
      state.index += 1;
      const kids = parseSequence(state);
      if (peek(state) !== undefined && peek(state).t === '}') state.index += 1;
      return kids;
    }

    function readRawGroup(state) {
      if (peek(state) === undefined || peek(state).t !== '{') return '';
      state.index += 1;
      let depth = 1;
      let text = '';
      while (state.index < state.tokens.length) {
        const token = state.tokens[state.index];
        state.index += 1;
        if (token.t === '{') {
          depth += 1;
          text += '{';
        } else if (token.t === '}') {
          depth -= 1;
          if (depth === 0) break;
          text += '}';
        } else if (token.t === 'char') {
          text += token.v;
        } else if (token.t === 'space') {
          text += ' ';
        } else if (token.t === 'cmd') {
          text += token.v.length > 1 ? '\\' + token.v : token.v;
        } else if (token.t === '&') {
          text += '&';
        } else if (token.t === '^') {
          text += '^';
        } else if (token.t === '_') {
          text += '_';
        }
      }
      return text;
    }

    function readDelimiter(state) {
      const token = peek(state);
      if (token === undefined) return '';
      state.index += 1;
      if (token.t === 'char') return DELIMITER_CHARS[token.v] !== undefined ? DELIMITER_CHARS[token.v] : token.v;
      if (token.t === 'cmd') return DELIMITER_CHARS[token.v] !== undefined ? DELIMITER_CHARS[token.v] : '';
      return '';
    }

    function applyScript(state, nodes, kind) {
      state.index += 1; // consume ^ or _ before reading its argument
      const argument = parseGroup(state);
      let base = nodes.length > 0 ? nodes.pop() : { type: 'empty' };
      if (base.type === 'bigop' || base.type === 'integral' || base.type === 'mathop') {
        if (kind === '^') base.sup = argument;
        else base.sub = argument;
        nodes.push(base);
        return;
      }
      if (base.type === 'brace' || (base.type === 'accent' && (base.mark === '⎴' || base.mark === '⎵'))) {
        if (kind === '^') base.sup = argument;
        else base.sub = argument;
        nodes.push(base);
        return;
      }
      if (base.type === 'script') {
        if (kind === '^') base.sup = argument;
        else base.sub = argument;
        nodes.push(base);
        return;
      }
      nodes.push({
        type: 'script',
        base,
        sup: kind === '^' ? argument : null,
        sub: kind === '_' ? argument : null,
      });
    }

    function parseCommand(state, name) {
      if (name === 'mathrel' || name === 'mathbin' || name === 'mathinner') {
        return { type: 'group', kids: parseGroup(state) };
      }
      if (name === 'sout' || name === 'cancel' || name === 'bcancel' || name === 'xcancel' || name === 'boxed') {
        return { type: 'decoration', decoration: name, body: parseGroup(state) };
      }
      if (name === 'colorbox') {
        const color = readRawGroup(state);
        return { type: 'decoration', decoration: 'colorbox', color: /^[a-zA-Z]+$/.test(color) ? color : 'transparent', body: parseGroup(state) };
      }
      if (name === 'not') return { type: 'not', body: parseGroup(state) };
      if (name === 'mathop') {
        const kids = parseGroup(state);
        const ch = kids.map(rawText).join('');
        if (ch === '⨅' || ch === '⨉') return { type: 'bigop', ch, sup: null, sub: null, limits: 'stack' };
        if (['⨌', '⨏', '∲', '∳', '⨋', '∱'].includes(ch)) return { type: 'integral', ch, sup: null, sub: null };
        return { type: 'mathop', kids, sup: null, sub: null, limits: 'stack' };
      }
      if (LABELLED_ARROWS[name] !== undefined) {
        let below = null;
        if (peek(state)?.t === 'char' && peek(state).v === '[') {
          state.index += 1;
          below = [];
          while (peek(state) !== undefined && !(peek(state).t === 'char' && peek(state).v === ']')) {
            if (peek(state).t === '^' || peek(state).t === '_') applyScript(state, below, peek(state).t);
            else below.push(parseAtom(state));
          }
          if (peek(state) !== undefined) state.index += 1;
        }
        return { type: 'xarrow', ch: LABELLED_ARROWS[name], above: parseGroup(state), below };
      }
      if (name === 'frac' || name === 'dfrac' || name === 'tfrac' || name === 'cfrac') {
        return { type: 'frac', num: parseGroup(state), den: parseGroup(state) };
      }
      if (name === 'hspace' || name === 'vspace' || name === 'mspace') {
        readRawGroup(state);
        return { type: 'space', w: '1em' };
      }
      if (name === 'binom' || name === 'dbinom' || name === 'tbinom') {
        return { type: 'binom', top: parseGroup(state), bottom: parseGroup(state) };
      }
      if (name === 'sqrt') {
        let index = null;
        if (peek(state) !== undefined && peek(state).t === 'char' && peek(state).v === '[') {
          state.index += 1;
          index = [];
          while (state.index < state.tokens.length) {
            const token = state.tokens[state.index];
            if (token.t === 'char' && token.v === ']') {
              state.index += 1;
              break;
            }
            index.push(parseAtom(state));
          }
        }
        return { type: 'sqrt', index, body: parseGroup(state) };
      }
      if (name === 'left') {
        let left = readDelimiter(state);
        let doubleLeft = false;
        let doubleEmptyLeft = false;
        if (left === '[' &&
            state.tokens[state.index]?.t === 'cmd' && state.tokens[state.index]?.v === '!' &&
            state.tokens[state.index + 1]?.t === 'cmd' && state.tokens[state.index + 1]?.v === 'left' &&
            state.tokens[state.index + 2]?.t === 'char' && state.tokens[state.index + 2]?.v === '[') {
          state.index += 3;
          left = '⟦';
          doubleLeft = true;
        } else if (left === '' &&
            state.tokens[state.index]?.t === 'cmd' && state.tokens[state.index]?.v === 'left' &&
            state.tokens[state.index + 1]?.t === 'char' && state.tokens[state.index + 1]?.v === '.') {
          state.index += 2;
          doubleEmptyLeft = true;
        }
        const kids = parseSequence(state);
        let right = '';
        if (peek(state) !== undefined && peek(state).t === 'cmd' && peek(state).v === 'right') {
          state.index += 1;
          right = readDelimiter(state);
          if ((doubleLeft || doubleEmptyLeft) && right === ']' &&
              state.tokens[state.index]?.t === 'cmd' && state.tokens[state.index]?.v === '!' &&
              state.tokens[state.index + 1]?.t === 'cmd' && state.tokens[state.index + 1]?.v === 'right' &&
              state.tokens[state.index + 2]?.t === 'char' && state.tokens[state.index + 2]?.v === ']') {
            state.index += 3;
            right = '⟧';
          } else if (doubleLeft && right === '' &&
              state.tokens[state.index]?.t === 'cmd' && state.tokens[state.index]?.v === 'right' &&
              state.tokens[state.index + 1]?.t === 'char' && state.tokens[state.index + 1]?.v === '.') {
            state.index += 2;
          }
        }
        return { type: 'delim', left, right, kids };
      }
      if (name === 'begin') return parseEnvironment(state);
      if (name === 'text' || name === 'textbf' || name === 'textit' || name === 'mbox') {
        return { type: 'textstyle', text: readRawGroup(state) };
      }
      if (name === 'overline' || name === 'underline') {
        return { type: 'line', position: name === 'overline' ? 'top' : 'bottom', body: parseGroup(state) };
      }
      if (name === 'overbrace' || name === 'underbrace') {
        return { type: 'brace', position: name === 'overbrace' ? 'top' : 'bottom', body: parseGroup(state) };
      }
      if (name === 'phantom' || name === 'hphantom' || name === 'vphantom') {
        return { type: 'phantom', body: parseGroup(state) };
      }
      if (name === 'overset' || name === 'underset') {
        const top = parseGroup(state);
        const base = parseGroup(state);
        return { type: 'stack', top, base, position: name === 'overset' ? 'over' : 'under' };
      }
      if (name === 'overgroup') return { type: 'accent', mark: '⏠', body: parseGroup(state), wide: true };
      if (name === 'undergroup') return { type: 'accent', mark: '⏡', body: parseGroup(state), below: true, wide: true };
      if (name === 'utilde') return { type: 'accent', mark: '˜', body: parseGroup(state), below: true, wide: true };
      if (name === 'overbracket') return { type: 'accent', mark: '⎴', body: parseGroup(state), wide: true };
      if (name === 'underbracket') return { type: 'accent', mark: '⎵', body: parseGroup(state), below: true, wide: true };
      if (name === 'underleftarrow') return { type: 'accent', mark: '←', body: parseGroup(state), below: true, wide: true };
      if (name === 'underleftrightarrow') return { type: 'accent', mark: '↔', body: parseGroup(state), below: true, wide: true };
      if (name === 'underrightharpoon') return { type: 'accent', mark: '⇀', body: parseGroup(state), below: true, wide: true };
      if (name === 'overrightharpoon') return { type: 'accent', mark: '⇀', body: parseGroup(state), wide: true };
      if (name === 'overleftharpoon') return { type: 'accent', mark: '↼', body: parseGroup(state), wide: true };
      if (name === 'underrightarrow') return { type: 'accent', mark: '→', body: parseGroup(state), below: true, wide: true };
      if (ACCENT_MARKS[name] !== undefined) {
        return { type: 'accent', mark: ACCENT_MARKS[name], body: parseGroup(state) };
      }
      if (name === 'widehat' || name === 'widecheck' || name === 'widetilde' || name === 'overrightarrow' ||
          name === 'overleftarrow' || name === 'overleftrightarrow') {
        return { type: 'accent', mark: name === 'widetilde' ? '˜' : name === 'widehat' ? 'ˆ' : name === 'widecheck' ? 'ˇ' :
          name === 'overleftarrow' ? '←' : name === 'overleftrightarrow' ? '↔' : '→', body: parseGroup(state), wide: true };
      }
      if (FONT_COMMANDS[name] !== undefined) {
        const font = FONT_COMMANDS[name];
        const kids = parseGroup(state);
        if (name === 'boldsymbol' && kids.length === 1 && kids[0].type === 'text' && kids[0].styled === 'mathcal') {
          const calChars = Array.from(ALPHABETS.mathcal).slice(0, 26);
          const boldChars = Array.from(ALPHABETS_BOLDSCR);
          const mapped = Array.from(kids[0].v).map((ch) => {
            const idx = calChars.indexOf(ch);
            return idx >= 0 ? boldChars[idx] : ch;
          }).join('');
          return { type: 'text', v: mapped, styled: 'mathbf' };
        }
        if (ALPHABETS[font] !== undefined) {
          const plain = kids.map(rawText).join('');
          return { type: 'text', v: mapAlphabet(plain, ALPHABETS[font]), styled: font };
        }
        return { type: 'font', font, kids };
      }
      if (BIG_OPERATORS.has(name)) {
        return { type: 'bigop', ch: SYMBOL_CHARS[name] || name, sup: null, sub: null, limits: 'stack' };
      }
      if (INTEGRALS.has(name)) {
        return { type: 'integral', ch: SYMBOL_CHARS[name] || '∫', sup: null, sub: null };
      }
      if (FUNCTION_NAMES.has(name)) {
        return { type: 'func', name: name === 'liminf' ? 'lim inf' : name === 'limsup' ? 'lim sup' : name };
      }
      if (name === 'quad') return { type: 'space', w: '1em' };
      if (name === 'qquad') return { type: 'space', w: '2em' };
      if (name === ',') return { type: 'space', w: '0.17em' };
      if (name === ':') return { type: 'space', w: '0.22em' };
      if (name === ';') return { type: 'space', w: '0.28em' };
      if (name === '!') return { type: 'space', w: '-0.17em' };
      if (name === ' ') return { type: 'space', w: '0.35em' };
      if (name === '\\') return { type: 'space', w: '0' };
      if (name === '{' || name === '}' || name === '%' || name === '&' || name === '#' || name === '_' || name === '$') {
        return { type: 'text', v: name };
      }
      if (name === '|') return { type: 'text', v: '‖' };
      if (name === 'operatorname') return { type: 'func', name: readRawGroup(state) };
      if (SYMBOL_CHARS[name] !== undefined) {
        return VAR_GREEK_TO_UPRIGHT[name] !== undefined
          ? { type: 'sym', ch: SYMBOL_CHARS[name], italic: true }
          : { type: 'sym', ch: SYMBOL_CHARS[name] };
      }
      return { type: 'text', v: '\\' + name, unknown: true };
    }

    function rawText(node) {
      if (node === undefined || node === null) return '';
      if (node.type === 'text') return node.v;
      if (node.type === 'textstyle') return node.text;
      if (node.type === 'group') return node.kids.map(rawText).join('');
      if (node.type === 'sym') return node.ch;
      if (node.type === 'space') return ' ';
      return '';
    }

    function parseEnvironment(state) {
      const rawName = readRawGroup(state);
      const env = rawName.trim();
      // \begin{array}{cc} carries the column spec outside the body.
      const alignment = env === 'array' && peek(state) !== undefined && peek(state).t === '{'
        ? readRawGroup(state).replace(/[^lcr]/g, '') : '';
      const rows = [];
      let row = [];
      let cell = [];
      while (state.index < state.tokens.length) {
        const token = state.tokens[state.index];
        if (token.t === 'cmd' && token.v === 'end') {
          state.index += 1;
          readRawGroup(state);
          break;
        }
        if (token.t === 'cmd' && token.v === '\\') {
          state.index += 1;
          row.push(cell);
          rows.push(row);
          row = [];
          cell = [];
          continue;
        }
        if (token.t === '&') {
          state.index += 1;
          row.push(cell);
          cell = [];
          continue;
        }
        if (token.t === '^' || token.t === '_') {
          applyScript(state, cell, token.t);
          continue;
        }
        const before = state.index;
        cell.push(parseAtom(state));
        if (state.index === before) state.index += 1;
      }
      if (cell.length > 0 || row.length > 0) {
        row.push(cell);
        rows.push(row);
      }
      return { type: 'matrix', env, rows, alignment };
    }

    /* ------------------------------ AxMath-style vector glyphs ------------------------------ */

    const ENV_DELIMITERS = {
      pmatrix: ['(', ')'],
      bmatrix: ['[', ']'],
      Bmatrix: ['{', '}'],
      vmatrix: ['|', '|'],
      Vmatrix: ['‖', '‖'],
      cases: ['{', ''],
      matrix: ['', ''],
      smallmatrix: ['', ''],
      aligned: ['', ''],
      array: ['', ''],
    };

    function PlaceholderBox(key) {
      return h(
        'svg',
        { key, className: 'dme-placeholder', viewBox: '0 0 10 10', role: 'img', 'aria-label': '□' },
        h('rect', {
          x: 1.1,
          y: 1.1,
          width: 7.8,
          height: 7.8,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.15,
          strokeDasharray: '1.9 1.25',
        }),
      );
    }

    // Seamless radical sign: the top horizontal segment sits at y=0 (offset top:0.675px)
    // with vectorEffect="non-scaling-stroke" so it aligns to the sub-pixel with .dme-sqrt-body's 1.35px border-top.
    function SurdSvg() {
      return h(
        'span',
        { className: 'dme-sqrt-surd', 'aria-hidden': 'true' },
        h(
          'svg',
          { className: 'dme-sqrt-svg', viewBox: '0 0 14 24', preserveAspectRatio: 'none', fill: 'none' },
          h('path', {
            d: 'M 0.9 13.6 L 3.3 11.8 L 6.7 22.4 L 13.75 0 H 14.9',
            stroke: 'currentColor',
            strokeWidth: 1.35,
            strokeLinecap: 'butt',
            strokeLinejoin: 'round',
            vectorEffect: 'non-scaling-stroke',
          }),
          h('path', {
            d: 'M 3.15 11.95 L 6.65 22.3',
            stroke: 'currentColor',
            strokeWidth: 2.1,
            strokeLinecap: 'round',
            vectorEffect: 'non-scaling-stroke',
          }),
        ),
      );
    }

    function integralStemElements(cx, keyPrefix) {
      return [
        h('path', {
          key: keyPrefix + '-p',
          d: `M ${cx + 3.4} 3.5 C ${cx + 3.1} 1.7, ${cx + 1.35} 1.85, ${cx + 0.95} 4.7 L ${cx - 0.95} 25.3 C ${cx - 1.35} 28.15, ${cx - 3.1} 28.3, ${cx - 3.4} 26.5`,
          stroke: 'currentColor',
          strokeWidth: 1.65,
          strokeLinecap: 'round',
          fill: 'none',
        }),
        h('circle', { key: keyPrefix + '-t', cx: cx + 3.15, cy: 3.55, r: 1.05, fill: 'currentColor' }),
        h('circle', { key: keyPrefix + '-b', cx: cx - 3.15, cy: 26.45, r: 1.05, fill: 'currentColor' }),
      ];
    }

    function IntegralGlyph(ch) {
      const stems =
        ch === '∬' || ch === '∯' ? [5.6, 10.4] :
        ch === '∭' || ch === '∰' ? [5.6, 10.2, 14.8] :
        ch === '⨌' ? [5.5, 9.9, 14.3, 18.7] : [6.5];
      const vw =
        stems.length === 4 ? 24.2 :
        stems.length === 3 ? 20.4 :
        stems.length === 2 ? 16.0 : 13.0;
      const midX = vw / 2;
      const extras = [];
      if (ch === '∮') {
        extras.push(h('circle', { key: 'loop', cx: midX, cy: 15, r: 3.65, stroke: 'currentColor', strokeWidth: 1.25, fill: 'none' }));
      } else if (ch === '∯') {
        extras.push(h('ellipse', { key: 'loop', cx: midX, cy: 15, rx: 5.35, ry: 3.75, stroke: 'currentColor', strokeWidth: 1.25, fill: 'none' }));
      } else if (ch === '∰') {
        extras.push(h('ellipse', { key: 'loop', cx: midX, cy: 15, rx: 7.45, ry: 3.85, stroke: 'currentColor', strokeWidth: 1.25, fill: 'none' }));
      } else if (ch === '∲') {
        // Clockwise contour integral: loop with clockwise arrow on right descending side
        extras.push(
          h('circle', { key: 'loop', cx: midX, cy: 15, r: 3.85, stroke: 'currentColor', strokeWidth: 1.25, fill: 'none' }),
          h('path', { key: 'arr', d: `M ${midX + 2.3} 14.1 L ${midX + 3.85} 16.5 L ${midX + 5.4} 14.1`, stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }),
        );
      } else if (ch === '∳') {
        // Counterclockwise contour integral: loop with upward arrow on right ascending side
        extras.push(
          h('circle', { key: 'loop', cx: midX, cy: 15, r: 3.85, stroke: 'currentColor', strokeWidth: 1.25, fill: 'none' }),
          h('path', { key: 'arr', d: `M ${midX + 2.3} 15.9 L ${midX + 3.85} 13.5 L ${midX + 5.4} 15.9`, stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }),
        );
      } else if (ch === '⨏') {
        extras.push(h('path', { key: 'bar', d: 'M 2.6 16.8 L 10.4 13.2', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round' }));
      } else if (ch === '⨋') {
        extras.push(h('path', { key: 'sum', d: 'M 9.6 11.2 H 3.5 L 6.7 15 L 3.5 18.8 H 9.6', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }));
      } else if (ch === '∱') {
        extras.push(
          h('path', { key: 'arc', d: 'M 3.2 9.5 A 3.6 3.2 0 1 1 9.8 9.8', stroke: 'currentColor', strokeWidth: 1.2, fill: 'none' }),
          h('path', { key: 'arr', d: 'M 8.3 8.6 L 9.9 10.2 L 11.1 8.4', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }),
        );
      }
      const emWidth = (vw / 27.5).toFixed(3) + 'em';
      return h(
        'span',
        { className: 'dme-opchar dme-int-op', 'aria-label': ch },
        h(
          'svg',
          { className: 'dme-int-svg', viewBox: `0 0 ${vw} 30`, style: { width: emWidth, height: '1.1em' }, 'aria-hidden': 'true' },
          ...stems.flatMap((cx, i) => integralStemElements(cx, 's' + i)),
          ...extras,
        ),
      );
    }

    function DelimSvg(delim, extraClass) {
      if (!delim) return null;
      const cls = 'dme-delim' + (extraClass ? ' ' + extraClass : '');
      const paths = [];
      let vw = 10;
      let widthEm = '0.38em';
      if (delim === '(') {
        paths.push('M 7.8 1 C 2.4 6.2, 2.4 25.8, 7.8 31');
      } else if (delim === ')') {
        paths.push('M 2.2 1 C 7.6 6.2, 7.6 25.8, 2.2 31');
      } else if (delim === '[') {
        paths.push('M 7.6 1.2 H 3.2 V 30.8 H 7.6');
      } else if (delim === ']') {
        paths.push('M 2.4 1.2 H 6.8 V 30.8 H 2.4');
      } else if (delim === '⟦') {
        vw = 13; widthEm = '0.48em';
        paths.push('M 10.6 1.2 H 2.2 V 30.8 H 10.6', 'M 6.2 1.2 V 30.8');
      } else if (delim === '⟧') {
        vw = 13; widthEm = '0.48em';
        paths.push('M 2.4 1.2 H 10.8 V 30.8 H 2.4', 'M 6.8 1.2 V 30.8');
      } else if (delim === '⌊') {
        paths.push('M 3.2 1.2 V 30.8 H 7.8');
      } else if (delim === '⌋') {
        paths.push('M 6.8 1.2 V 30.8 H 2.2');
      } else if (delim === '⌈') {
        paths.push('M 7.8 1.2 H 3.2 V 30.8');
      } else if (delim === '⌉') {
        paths.push('M 2.2 1.2 H 6.8 V 30.8');
      } else if (delim === '{') {
        vw = 11; widthEm = '0.42em';
        paths.push('M 8.4 1.2 C 5.2 1.2, 5.2 3.4, 5.2 6.5 V 12.6 C 5.2 14.6, 4.0 15.8, 2.2 16 C 4.0 16.2, 5.2 17.4, 5.2 19.4 V 25.5 C 5.2 28.6, 5.2 30.8, 8.4 30.8');
      } else if (delim === '}') {
        vw = 11; widthEm = '0.42em';
        paths.push('M 2.6 1.2 C 5.8 1.2, 5.8 3.4, 5.8 6.5 V 12.6 C 5.8 14.6, 7.0 15.8, 8.8 16 C 7.0 16.2, 5.8 17.4, 5.8 19.4 V 25.5 C 5.8 28.6, 5.8 30.8, 2.6 30.8');
      } else if (delim === '⟨') {
        paths.push('M 7.6 1.4 L 2.4 16 L 7.6 30.6');
      } else if (delim === '⟩') {
        paths.push('M 2.4 1.4 L 7.6 16 L 2.4 30.6');
      } else if (delim === '|' || delim === '∣') {
        vw = 7; widthEm = '0.28em';
        paths.push('M 3.5 1 V 31');
      } else if (delim === '‖') {
        vw = 10; widthEm = '0.38em';
        paths.push('M 3.3 1 V 31', 'M 6.7 1 V 31');
      } else if (delim === '/') {
        paths.push('M 8.0 1.4 L 2.0 30.6');
      } else if (delim === '\\') {
        paths.push('M 2.0 1.4 L 8.0 30.6');
      } else {
        return h('span', { className: cls }, delim);
      }
      return h(
        'span',
        { className: cls, 'aria-label': delim },
        h(
          'svg',
          { className: 'dme-delim-svg', viewBox: `0 0 ${vw} 32`, preserveAspectRatio: 'none', style: { width: widthEm }, fill: 'none', 'aria-hidden': 'true' },
          ...paths.map((d, i) => h('path', {
            key: i,
            d,
            stroke: 'currentColor',
            strokeWidth: 1.35,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            vectorEffect: 'non-scaling-stroke',
          })),
        ),
      );
    }

    function WideAccentSvg(mark, below, wide) {
      if (!wide) {
        return h('span', { className: 'dme-accent-mark' }, mark);
      }
      let paths = [];
      let vh = 8;
      if (mark === 'ˆ') {
        paths = ['M 1 6.5 L 20 1.5 L 39 6.5'];
      } else if (mark === 'ˇ') {
        paths = ['M 1 1.5 L 20 6.5 L 39 1.5'];
      } else if (mark === '˜') {
        paths = ['M 1 5.5 C 8 1, 14 1, 20 4 C 26 7, 32 7, 39 2.5'];
      } else if (mark === '⏠') {
        paths = ['M 1 6.8 C 7 1.2, 33 1.2, 39 6.8'];
      } else if (mark === '⏡') {
        paths = ['M 1 1.2 C 7 6.8, 33 6.8, 39 1.2'];
      } else if (mark === '⎴') {
        paths = ['M 1.2 6.8 V 2 H 38.8 V 6.8'];
      } else if (mark === '⎵') {
        paths = ['M 1.2 1.2 V 6 H 38.8 V 1.2'];
      } else if (mark === '→') {
        return h('span', { className: 'dme-accent-mark dme-accent-arrow' },
          h('span', { className: 'dme-arrow-shaft' }),
          h('svg', { className: 'dme-arrow-tip', viewBox: '0 0 7 8', fill: 'none' },
            h('path', { d: 'M 0.5 1 L 6 4 L 0.5 7', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round', strokeLinejoin: 'round' })));
      } else if (mark === '←') {
        return h('span', { className: 'dme-accent-mark dme-accent-arrow' },
          h('svg', { className: 'dme-arrow-tip', viewBox: '0 0 7 8', fill: 'none' },
            h('path', { d: 'M 6.5 1 L 1 4 L 6.5 7', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round', strokeLinejoin: 'round' })),
          h('span', { className: 'dme-arrow-shaft' }));
      } else if (mark === '↔') {
        return h('span', { className: 'dme-accent-mark dme-accent-arrow' },
          h('svg', { className: 'dme-arrow-tip', viewBox: '0 0 7 8', fill: 'none' },
            h('path', { d: 'M 6.5 1 L 1 4 L 6.5 7', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round', strokeLinejoin: 'round' })),
          h('span', { className: 'dme-arrow-shaft' }),
          h('svg', { className: 'dme-arrow-tip', viewBox: '0 0 7 8', fill: 'none' },
            h('path', { d: 'M 0.5 1 L 6 4 L 0.5 7', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round', strokeLinejoin: 'round' })));
      } else if (mark === '⇀') {
        return h('span', { className: 'dme-accent-mark dme-accent-arrow' },
          h('span', { className: 'dme-arrow-shaft' }),
          h('svg', { className: 'dme-arrow-tip', viewBox: '0 0 7 8', fill: 'none' },
            h('path', { d: below ? 'M 6 4 L 0.8 7' : 'M 0.8 1 L 6 4', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round' })));
      } else if (mark === '↼') {
        return h('span', { className: 'dme-accent-mark dme-accent-arrow' },
          h('svg', { className: 'dme-arrow-tip', viewBox: '0 0 7 8', fill: 'none' },
            h('path', { d: 'M 6.2 1 L 1 4', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round' })),
          h('span', { className: 'dme-arrow-shaft' }));
      } else {
        return h('span', { className: 'dme-accent-mark' }, mark);
      }
      return h(
        'span',
        { className: 'dme-accent-mark dme-accent-svg-wrap', 'aria-hidden': 'true' },
        h(
          'svg',
          { className: 'dme-accent-svg', viewBox: `0 0 40 ${vh}`, preserveAspectRatio: 'none', fill: 'none' },
          ...paths.map((d, i) => h('path', {
            key: i,
            d,
            stroke: 'currentColor',
            strokeWidth: 1.3,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            vectorEffect: 'non-scaling-stroke',
          })),
        ),
      );
    }

    function BraceSvg(position) {
      const d = position === 'top'
        ? 'M 1 8.5 C 1 4.8, 3.2 4.6, 6.8 4.6 H 25.5 C 28.2 4.6, 29.6 3.5, 30 1 C 30.4 3.5, 31.8 4.6, 34.5 4.6 H 53.2 C 56.8 4.6, 59 4.8, 59 8.5'
        : 'M 1 1.5 C 1 5.2, 3.2 5.4, 6.8 5.4 H 25.5 C 28.2 5.4, 29.6 6.5, 30 9 C 30.4 6.5, 31.8 5.4, 34.5 5.4 H 53.2 C 56.8 5.4, 59 5.2, 59 1.5';
      return h(
        'span',
        { className: 'dme-brace-svg-wrap', 'aria-hidden': 'true' },
        h(
          'svg',
          { className: 'dme-brace-svg', viewBox: '0 0 60 10', preserveAspectRatio: 'none', fill: 'none' },
          h('path', {
            d,
            stroke: 'currentColor',
            strokeWidth: 1.3,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            vectorEffect: 'non-scaling-stroke',
          }),
        ),
      );
    }

    function XArrowMarkSvg(ch) {
      if (ch === '═') {
        return h('span', { className: 'dme-xarrow-mark dme-xarrow-stretch', 'aria-label': ch },
          h('span', { className: 'dme-xarrow-double' }));
      }
      if (ch === '⟹') {
        return h('span', { className: 'dme-xarrow-mark dme-xarrow-stretch', 'aria-label': ch },
          h('span', { className: 'dme-xarrow-double' }),
          h('svg', { className: 'dme-xarrow-head', viewBox: '0 0 8 10', fill: 'none' },
            h('path', { d: 'M 0.8 1 L 6.8 5 L 0.8 9', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round', strokeLinejoin: 'round' })));
      }
      if (ch === '⟶') {
        return h('span', { className: 'dme-xarrow-mark dme-xarrow-stretch', 'aria-label': ch },
          h('span', { className: 'dme-arrow-shaft' }),
          h('svg', { className: 'dme-xarrow-head', viewBox: '0 0 7 8', fill: 'none' },
            h('path', { d: 'M 0.5 1 L 6 4 L 0.5 7', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round', strokeLinejoin: 'round' })));
      }
      if (ch === '⟵') {
        return h('span', { className: 'dme-xarrow-mark dme-xarrow-stretch', 'aria-label': ch },
          h('svg', { className: 'dme-xarrow-head', viewBox: '0 0 7 8', fill: 'none' },
            h('path', { d: 'M 6.5 1 L 1 4 L 6.5 7', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round', strokeLinejoin: 'round' })),
          h('span', { className: 'dme-arrow-shaft' }));
      }
      if (ch === '⟷') {
        return h('span', { className: 'dme-xarrow-mark dme-xarrow-stretch', 'aria-label': ch },
          h('svg', { className: 'dme-xarrow-head', viewBox: '0 0 7 8', fill: 'none' },
            h('path', { d: 'M 6.5 1 L 1 4 L 6.5 7', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round', strokeLinejoin: 'round' })),
          h('span', { className: 'dme-arrow-shaft' }),
          h('svg', { className: 'dme-xarrow-head', viewBox: '0 0 7 8', fill: 'none' },
            h('path', { d: 'M 0.5 1 L 6 4 L 0.5 7', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round', strokeLinejoin: 'round' })));
      }
      if (ch === '⇄') {
        return h('span', { className: 'dme-xarrow-mark dme-xarrow-dual', 'aria-label': ch },
          h('span', { className: 'dme-xarrow-row' },
            h('span', { className: 'dme-arrow-shaft' }),
            h('svg', { className: 'dme-xarrow-head-sm', viewBox: '0 0 6 6', fill: 'none' },
              h('path', { d: 'M 0.5 0.8 L 5.2 3 L 0.5 5.2', stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round', strokeLinejoin: 'round' }))),
          h('span', { className: 'dme-xarrow-row' },
            h('svg', { className: 'dme-xarrow-head-sm', viewBox: '0 0 6 6', fill: 'none' },
              h('path', { d: 'M 5.5 0.8 L 0.8 3 L 5.5 5.2', stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round', strokeLinejoin: 'round' })),
            h('span', { className: 'dme-arrow-shaft' })));
      }
      if (ch === '⇌' || ch === '⇋') {
        const rightTop = ch === '⇌';
        return h('span', { className: 'dme-xarrow-mark dme-xarrow-dual', 'aria-label': ch },
          h('span', { className: 'dme-xarrow-row' },
            rightTop ? null : h('svg', { className: 'dme-xarrow-head-sm', viewBox: '0 0 6 5', fill: 'none' },
              h('path', { d: 'M 5.2 0.8 L 0.8 4', stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round' })),
            h('span', { className: 'dme-arrow-shaft' }),
            rightTop ? h('svg', { className: 'dme-xarrow-head-sm', viewBox: '0 0 6 5', fill: 'none' },
              h('path', { d: 'M 0.8 0.8 L 5.2 4', stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round' })) : null),
          h('span', { className: 'dme-xarrow-row' },
            rightTop ? h('svg', { className: 'dme-xarrow-head-sm', viewBox: '0 0 6 5', fill: 'none' },
              h('path', { d: 'M 0.8 1 L 5.2 4.2', stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round' })) : null,
            h('span', { className: 'dme-arrow-shaft' }),
            rightTop ? null : h('svg', { className: 'dme-xarrow-head-sm', viewBox: '0 0 6 5', fill: 'none' },
              h('path', { d: 'M 5.2 1 L 0.8 4.2', stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round' }))));
      }
      if (ch === '⇀') {
        return h('span', { className: 'dme-xarrow-mark dme-xarrow-stretch', 'aria-label': ch },
          h('span', { className: 'dme-arrow-shaft' }),
          h('svg', { className: 'dme-xarrow-head', viewBox: '0 0 7 6', fill: 'none' },
            h('path', { d: 'M 0.8 1 L 6 4.8', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round' })));
      }
      if (ch === '↽') {
        return h('span', { className: 'dme-xarrow-mark dme-xarrow-stretch', 'aria-label': ch },
          h('svg', { className: 'dme-xarrow-head', viewBox: '0 0 7 6', fill: 'none' },
            h('path', { d: 'M 1 1.2 L 6.2 5', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round' })),
          h('span', { className: 'dme-arrow-shaft' }));
      }
      return h('span', { className: 'dme-xarrow-mark' }, ch);
    }

    function LongDivCurveSvg() {
      return h(
        'span',
        { className: 'dme-longdiv-curve', 'aria-hidden': 'true' },
        h(
          'svg',
          { className: 'dme-longdiv-svg', viewBox: '0 0 8 24', preserveAspectRatio: 'none', fill: 'none' },
          h('path', {
            d: 'M 7.2 0 C 5.8 6.8, 4.8 15.6, 1.2 23.2',
            stroke: 'currentColor',
            strokeWidth: 1.35,
            strokeLinecap: 'round',
            vectorEffect: 'non-scaling-stroke',
          }),
        ),
      );
    }

    function renderFrameWrap(position, leftDecor, rightDecor, innerContent, key) {
      const classes = ['dme-frame', position === 'top' ? 'dme-frame-top' : 'dme-frame-bottom'];
      if (leftDecor === 'corner') classes.push('dme-frame-l-corner');
      if (rightDecor === 'corner') classes.push('dme-frame-r-corner');
      return h(
        'span',
        { key, className: classes.join(' ') },
        leftDecor === 'arrow' ? h(
          'span',
          { className: 'dme-frame-arrow dme-frame-arrow-l' },
          h('svg', { viewBox: '0 0 8 22', preserveAspectRatio: 'none', fill: 'none' },
            h('path', {
              d: position === 'top' ? 'M 4 0 V 19' : 'M 4 22 V 3',
              stroke: 'currentColor', strokeWidth: 1.35, vectorEffect: 'non-scaling-stroke',
            })),
          h('svg', { className: 'dme-frame-arrow-tip ' + (position === 'top' ? 'is-down' : 'is-up'), viewBox: '0 0 8 6', fill: 'none' },
            h('path', {
              d: position === 'top' ? 'M 1 1 L 4 5 L 7 1' : 'M 1 5 L 4 1 L 7 5',
              stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round',
            })),
        ) : null,
        h('span', { className: 'dme-frame-body' }, innerContent),
        rightDecor === 'arrow' ? h(
          'span',
          { className: 'dme-frame-arrow dme-frame-arrow-r' },
          h('svg', { viewBox: '0 0 8 22', preserveAspectRatio: 'none', fill: 'none' },
            h('path', {
              d: position === 'top' ? 'M 4 0 V 19' : 'M 4 22 V 3',
              stroke: 'currentColor', strokeWidth: 1.35, vectorEffect: 'non-scaling-stroke',
            })),
          h('svg', { className: 'dme-frame-arrow-tip ' + (position === 'top' ? 'is-down' : 'is-up'), viewBox: '0 0 8 6', fill: 'none' },
            h('path', {
              d: position === 'top' ? 'M 1 1 L 4 5 L 7 1' : 'M 1 5 L 4 1 L 7 5',
              stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round',
            })),
        ) : null,
      );
    }

    function detectConnectedFrame(nodes, index) {
      const a = nodes[index];
      const b = nodes[index + 1];
      const c = nodes[index + 2];
      // \ulcorner \overline{...} [\downarrow]
      if (a?.type === 'sym' && a.ch === '⌜' && b?.type === 'line' && b.position === 'top') {
        const hasArrow = c?.type === 'sym' && c.ch === '↓';
        return { count: hasArrow ? 3 : 2, position: 'top', left: 'corner', right: hasArrow ? 'arrow' : null, lineNode: b };
      }
      // \llcorner \underline{...} [\uparrow]
      if (a?.type === 'sym' && a.ch === '⌞' && b?.type === 'line' && b.position === 'bottom') {
        const hasArrow = c?.type === 'sym' && c.ch === '↑';
        return { count: hasArrow ? 3 : 2, position: 'bottom', left: 'corner', right: hasArrow ? 'arrow' : null, lineNode: b };
      }
      // \downarrow \overline{...} \urcorner
      if (a?.type === 'sym' && a.ch === '↓' && b?.type === 'line' && b.position === 'top' && c?.type === 'sym' && c.ch === '⌝') {
        return { count: 3, position: 'top', left: 'arrow', right: 'corner', lineNode: b };
      }
      // \uparrow \underline{...} \lrcorner
      if (a?.type === 'sym' && a.ch === '↑' && b?.type === 'line' && b.position === 'bottom' && c?.type === 'sym' && c.ch === '⌟') {
        return { count: 3, position: 'bottom', left: 'arrow', right: 'corner', lineNode: b };
      }
      // \overline{...} \urcorner
      if (a?.type === 'line' && a.position === 'top' && b?.type === 'sym' && b.ch === '⌝') {
        return { count: 2, position: 'top', left: null, right: 'corner', lineNode: a };
      }
      // \underline{...} \lrcorner
      if (a?.type === 'line' && a.position === 'bottom' && b?.type === 'sym' && b.ch === '⌟') {
        return { count: 2, position: 'bottom', left: null, right: 'corner', lineNode: a };
      }
      return null;
    }

    function renderList(nodes, key) {
      const out = [];
      let index = 0;
      while (index < nodes.length) {
        const frame = detectConnectedFrame(nodes, index);
        if (frame !== null) {
          out.push(renderFrameWrap(
            frame.position,
            frame.left,
            frame.right,
            renderList(frame.lineNode.body, key + '.' + index + 'f'),
            key + '.' + index,
          ));
          index += frame.count;
          continue;
        }
        out.push(renderNode(nodes[index], key + '.' + index));
        index += 1;
      }
      return out;
    }

    function renderDelimKids(kids, key) {
      // Stretch interior \mid divider to match outer delimiters (e.g. [ x | y ], < x | y >)
      const midIdx = kids.findIndex((k) => k && k.type === 'sym' && k.ch === '∣');
      if (midIdx >= 0) {
        const leftPart = kids.slice(0, midIdx);
        const rightPart = kids.slice(midIdx + 1);
        return [
          h('span', { key: key + 'l', className: 'dme-delim-body' }, ...renderList(leftPart, key + 'l')),
          DelimSvg('∣', 'dme-delim-mid'),
          h('span', { key: key + 'r', className: 'dme-delim-body' }, ...renderList(rightPart, key + 'r')),
        ];
      }
      return [h('span', { key: key + 'b', className: 'dme-delim-body' }, ...renderList(kids, key + 'k'))];
    }

    function renderNode(node, key) {
      if (node === null || node === undefined) return null;
      switch (node.type) {
        case 'empty':
          return null;
        case 'text':
          if (node.v === '□' && node.unknown !== true) {
            return PlaceholderBox(key);
          }
          return h(
            'span',
            {
              key,
              className:
                (node.styled !== undefined ? 'dme-font dme-font-' + node.styled + ' ' : '') +
                (node.unknown === true ? 'dme-unknown' : /[a-zA-Z]/.test(node.v) ? 'dme-var' : 'dme-num'),
            },
            node.v,
          );
        case 'sym':
          return h(
            'span',
            { key, className: (node.italic === true || /^[α-ωϵϑϰϖϱςϕϝ]$/.test(node.ch)) ? 'dme-var' : 'dme-sym' },
            node.ch,
          );
        case 'func':
          return h('span', { key, className: 'dme-func' }, node.name);
        case 'space':
          return h('span', { key, style: { display: 'inline-block', width: node.w } });
        case 'group':
          return h(React.Fragment, { key }, ...renderList(node.kids, key));
        case 'frac':
          return h(
            'span',
            { key, className: 'dme-frac' },
            h('span', { className: 'dme-frac-num' }, ...renderList(node.num, key + 'n')),
            h('span', { className: 'dme-frac-den' }, ...renderList(node.den, key + 'd')),
          );
        case 'binom':
          return h(
            'span',
            { key, className: 'dme-delim-wrap' },
            DelimSvg('('),
            h(
              'span',
              { className: 'dme-binom' },
              h('span', { className: 'dme-binom-top' }, ...renderList(node.top, key + 't')),
              h('span', { className: 'dme-binom-bottom' }, ...renderList(node.bottom, key + 'b')),
            ),
            DelimSvg(')'),
          );
        case 'sqrt':
          return h(
            'span',
            { key, className: 'dme-sqrt' },
            node.index !== null
              ? h('span', { className: 'dme-sqrt-index' }, ...renderList(node.index, key + 'i'))
              : null,
            SurdSvg(),
            h('span', { className: 'dme-sqrt-body' }, ...renderList(node.body, key + 'b')),
          );
        case 'script':
          return h(
            'span',
            { key, className: 'dme-script' },
            renderNode(node.base, key + 'b'),
            h(
              'span',
              { className: 'dme-scripts' },
              node.sup !== null ? h('span', { className: 'dme-sup' }, ...renderList(node.sup, key + 's')) : null,
              node.sub !== null ? h('span', { className: 'dme-sub' }, ...renderList(node.sub, key + 'u')) : null,
            ),
          );
        case 'bigop':
          if (node.limits === 'side') {
            return h(
              'span', { key, className: 'dme-integral' },
              h('span', { className: 'dme-opchar' }, node.ch),
              h('span', { className: 'dme-scripts dme-integral-scripts' },
                node.sup !== null ? h('span', { className: 'dme-sup' }, ...renderList(node.sup, key + 's')) : null,
                node.sub !== null ? h('span', { className: 'dme-sub' }, ...renderList(node.sub, key + 'u')) : null),
            );
          }
          return h(
            'span',
            { key, className: 'dme-bigop' },
            node.sup !== null ? h('span', { className: 'dme-lim' }, ...renderList(node.sup, key + 's')) : null,
            h('span', { className: 'dme-opchar' }, node.ch),
            node.sub !== null ? h('span', { className: 'dme-lim' }, ...renderList(node.sub, key + 'u')) : null,
          );
        case 'integral':
          if (node.limits === 'stack') {
            return h(
              'span', { key, className: 'dme-bigop dme-integral-stack' },
              node.sup !== null ? h('span', { className: 'dme-lim' }, ...renderList(node.sup, key + 's')) : null,
              IntegralGlyph(node.ch),
              node.sub !== null ? h('span', { className: 'dme-lim' }, ...renderList(node.sub, key + 'u')) : null,
            );
          }
          return h(
            'span',
            { key, className: 'dme-integral' },
            IntegralGlyph(node.ch),
            node.sup !== null || node.sub !== null
              ? h(
                  'span',
                  { className: 'dme-scripts dme-integral-scripts' },
                  node.sup !== null ? h('span', { className: 'dme-sup' }, ...renderList(node.sup, key + 's')) : null,
                  node.sub !== null ? h('span', { className: 'dme-sub' }, ...renderList(node.sub, key + 'u')) : null,
                )
              : null,
          );
        case 'mathop':
          if (node.limits === 'side') {
            return h('span', { key, className: 'dme-script' },
              h('span', null, ...renderList(node.kids, key + 'b')),
              h('span', { className: 'dme-scripts' },
                node.sup !== null ? h('span', { className: 'dme-sup' }, ...renderList(node.sup, key + 's')) : null,
                node.sub !== null ? h('span', { className: 'dme-sub' }, ...renderList(node.sub, key + 'u')) : null));
          }
          return h('span', { key, className: 'dme-bigop' },
            node.sup !== null ? h('span', { className: 'dme-lim' }, ...renderList(node.sup, key + 's')) : null,
            h('span', null, ...renderList(node.kids, key + 'b')),
            node.sub !== null ? h('span', { className: 'dme-lim' }, ...renderList(node.sub, key + 'u')) : null);
        case 'delim':
          return h(
            'span',
            { key, className: 'dme-delim-wrap' },
            node.left !== '' ? DelimSvg(node.left) : null,
            ...renderDelimKids(node.kids, key),
            node.right !== '' ? DelimSvg(node.right) : null,
          );
        case 'matrix':
          return renderMatrix(node, key);
        case 'xarrow':
          return h('span', { key, className: 'dme-xarrow' },
            h('span', { className: 'dme-xarrow-label' }, ...renderList(node.above, key + 'a')),
            XArrowMarkSvg(node.ch),
            node.below === null ? null : h('span', { className: 'dme-xarrow-label' }, ...renderList(node.below, key + 'b')),
          );
        case 'stack':
          return h(
            'span',
            { key, className: node.position === 'under' ? 'dme-stack dme-stack-under' : 'dme-stack' },
            h('span', { className: 'dme-stack-top' }, ...renderList(node.top, key + 't')),
            h('span', { className: 'dme-stack-base' }, ...renderList(node.base, key + 'b')),
          );
        case 'not':
          return h('span', { key, className: 'dme-not' }, ...renderList(node.body, key + 'n'));
        case 'decoration':
          return h('span', { key, className: 'dme-decoration dme-decoration-' + node.decoration,
            style: node.decoration === 'colorbox' ? { backgroundColor: node.color } : undefined },
          ...renderList(node.body, key + 'd'));
        case 'accent': {
          const hasLabel = node.sup !== undefined || node.sub !== undefined;
          const accentEl = h(
            'span',
            { key: hasLabel ? undefined : key, className: (node.below ? 'dme-accent dme-accent-below' : 'dme-accent') + (node.wide ? ' dme-accent-wide' : '') },
            h('span', { className: 'dme-accent-body' }, ...renderList(node.body, key + 'b')),
            WideAccentSvg(node.mark, Boolean(node.below), Boolean(node.wide)),
          );
          if (!hasLabel) return accentEl;
          return h(
            'span',
            { key, className: 'dme-overunder-wrap' },
            node.sup ? h('span', { className: 'dme-overunder-label' }, ...renderList(node.sup, key + 'sp')) : null,
            accentEl,
            node.sub ? h('span', { className: 'dme-overunder-label' }, ...renderList(node.sub, key + 'sb')) : null,
          );
        }
        case 'line':
          if (node.position === 'top' && node.body.length > 0 && node.body[0].type === 'text' && node.body[0].v === ')') {
            return h(
              'span',
              { key, className: 'dme-longdiv' },
              LongDivCurveSvg(),
              h('span', { className: 'dme-line-top dme-longdiv-body' }, ...renderList(node.body.slice(1), key + 'ld')),
            );
          }
          return h(
            'span',
            { key, className: node.position === 'top' ? 'dme-line-top' : 'dme-line-bottom' },
            ...renderList(node.body, key + 'b'),
          );
        case 'brace':
          return h(
            'span',
            { key, className: 'dme-brace-wrap ' + (node.position === 'top' ? 'dme-brace-top' : 'dme-brace-bottom') },
            node.position === 'top' && node.sup ? h('span', { className: 'dme-overunder-label' }, ...renderList(node.sup, key + 'sp')) : null,
            node.position === 'top' ? BraceSvg('top') : null,
            h('span', { className: 'dme-brace-body' }, ...renderList(node.body, key + 'b')),
            node.position === 'bottom' ? BraceSvg('bottom') : null,
            node.position === 'bottom' && node.sub ? h('span', { className: 'dme-overunder-label' }, ...renderList(node.sub, key + 'sb')) : null,
          );
        case 'phantom':
          return h('span', { key, className: 'dme-phantom' }, ...renderList(node.body, key + 'b'));
        case 'font':
          return h(
            'span',
            { key, className: 'dme-font dme-font-' + node.font },
            ...renderList(node.kids, key + 'f'),
          );
        case 'textstyle':
          return h('span', { key, className: 'dme-text' }, node.text);
        default:
          return null;
      }
    }

    function renderMatrix(node, key) {
      const delimiters = ENV_DELIMITERS[node.env] || ['', ''];
      const rows = node.rows;
      const table = h(
        'table',
        { className: 'dme-matrix' },
        h(
          'tbody',
          null,
          rows.map((row, rowIndex) =>
            h(
              'tr',
              { key: rowIndex },
              row.map((cell, cellIndex) =>
                h(
                  'td',
                  {
                    key: cellIndex,
                    className: node.env === 'cases' || node.env === 'aligned' || node.alignment[cellIndex] === 'l'
                      ? 'dme-align-left' : node.alignment[cellIndex] === 'r' ? 'dme-align-right' : undefined,
                  },
                  ...renderList(cell, key + '-' + rowIndex + '-' + cellIndex),
                ),
              ),
            ),
          ),
        ),
      );
      return h(
        'span',
        { key, className: 'dme-matrix-wrap' },
        delimiters[0] !== '' ? DelimSvg(delimiters[0], 'dme-delim-big') : null,
        table,
        delimiters[1] !== '' ? DelimSvg(delimiters[1], 'dme-delim-big') : null,
      );
    }

    function renderMath(source, options) {
      const className = 'dme-math' + (options !== undefined && options.mini === true ? ' dme-math-mini' : '');
      if (source.trim() === '') return h('span', { className });
      try {
        const nodes = parseLatex(source);
        return h('span', { className }, ...renderList(nodes, 'r'));
      } catch (error) {
        return h('span', { className: className + ' dme-unknown' }, source);
      }
    }

    /* =======================================================================
     * 2b. Interactive Visual Formula AST & Editing Engine (AxMath-style)
     * ===================================================================== */

    const SINGLE_GLYPH_TEXT_SYMS = new Set([
      '°', '§', '€', '£', '¥', '©', '®', '¶', '‵', '‰', '✋', '🕊', '☺', '☯', '✿', '✘', '',
      '⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '👍', '👎',
    ]);

    function tokenizeOffsets(source) {
      const tokens = [];
      let index = 0;
      while (index < source.length) {
        const ch = String.fromCodePoint(source.codePointAt(index));
        const start = index;
        if (ch === '\\') {
          const word = /^[a-zA-Z]+/.exec(source.slice(index + 1));
          if (word !== null) {
            index += 1 + word[0].length;
            tokens.push({ t: 'cmd', v: word[0], start, end: index });
          } else {
            const nextCh = index + 1 < source.length ? String.fromCodePoint(source.codePointAt(index + 1)) : '';
            index += 1 + (nextCh === '' ? 0 : nextCh.length);
            tokens.push({ t: 'cmd', v: nextCh, start, end: index });
          }
        } else if (ch === '{' || ch === '}' || ch === '^' || ch === '_' || ch === '&') {
          index += 1;
          tokens.push({ t: ch, v: ch, start, end: index });
        } else if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
          index += 1;
          tokens.push({ t: 'ws', v: ch, start, end: index });
        } else {
          index += ch.length;
          tokens.push({ t: 'char', v: ch, start, end: index });
        }
      }
      return tokens;
    }

    function joinLatexParts(left, mid, right) {
      let out = left;
      if (mid.length > 0) {
        if (/\\[a-zA-Z]+$/.test(out) && /^[a-zA-Z]/.test(mid)) out += ' ';
        out += mid;
      }
      if (right.length > 0) {
        if (/\\[a-zA-Z]+$/.test(out) && /^[a-zA-Z]/.test(right)) out += ' ';
        out += right;
      }
      return out;
    }

    function parseVisual(source) {
      const tokens = tokenizeOffsets(source);
      const doc = {
        source,
        tokens,
        rootSlotId: 'root',
        slots: new Map(),
        atoms: new Map(),
        slotOrder: [],
        stops: [],
      };
      const state = { tokens, index: 0, source, doc };

      function createSlot(spec) {
        const slot = {
          id: spec.id,
          parentAtomId: spec.parentAtomId || null,
          role: spec.role || 'body',
          atoms: [],
          contentStart: spec.contentStart,
          contentEnd: spec.contentEnd,
          outerStart: spec.outerStart !== undefined ? spec.outerStart : spec.contentStart,
          outerEnd: spec.outerEnd !== undefined ? spec.outerEnd : spec.contentEnd,
          opStart: spec.opStart !== undefined ? spec.opStart : null,
          braced: spec.braced !== false,
          isMatrixCell: Boolean(spec.isMatrixCell),
          isTextSlot: Boolean(spec.isTextSlot),
          readOnly: Boolean(spec.readOnly),
          skipTab: Boolean(spec.skipTab),
        };
        doc.slots.set(slot.id, slot);
        doc.slotOrder.push(slot.id);
        return slot;
      }

      function registerAtom(slot, atomData) {
        const atom = {
          ...atomData,
          slotId: slot.id,
          indexInSlot: slot.atoms.length,
          childSlots: atomData.childSlots || [],
        };
        slot.atoms.push(atom);
        doc.atoms.set(atom.id, atom);
        return atom;
      }

      function skipWs() {
        while (state.index < tokens.length && tokens[state.index].t === 'ws') {
          state.index += 1;
        }
      }

      function vPeek() {
        return tokens[state.index];
      }

      function consumeBalancedBraces() {
        skipWs();
        const open = vPeek();
        if (!open || open.t !== '{') return null;
        state.index += 1;
        const contentStart = open.end;
        let depth = 1;
        while (state.index < tokens.length) {
          const tk = tokens[state.index];
          state.index += 1;
          if (tk.t === '{') depth += 1;
          else if (tk.t === '}') {
            depth -= 1;
            if (depth === 0) {
              return { outerStart: open.start, contentStart, contentEnd: tk.start, outerEnd: tk.end, closed: true };
            }
          }
        }
        return { outerStart: open.start, contentStart, contentEnd: source.length, outerEnd: source.length, closed: false };
      }

      function parseTextSlot(slotId, parentAtomId, role) {
        skipWs();
        const range = consumeBalancedBraces();
        if (range === null) {
          const pos = vPeek() ? vPeek().start : source.length;
          return createSlot({
            id: slotId, parentAtomId, role,
            contentStart: pos, contentEnd: pos, outerStart: pos, outerEnd: pos,
            braced: false, isTextSlot: true,
          });
        }
        const slot = createSlot({
          id: slotId, parentAtomId, role,
          contentStart: range.contentStart, contentEnd: range.contentEnd,
          outerStart: range.outerStart, outerEnd: range.outerEnd,
          braced: true, isTextSlot: true,
        });
        const raw = source.slice(range.contentStart, range.contentEnd);
        let offset = range.contentStart;
        let idx = 0;
        for (const ch of Array.from(raw)) {
          registerAtom(slot, {
            id: slotId + '/' + idx,
            type: 'textchar',
            v: ch,
            start: offset,
            end: offset + ch.length,
            childSlots: [],
          });
          offset += ch.length;
          idx += 1;
        }
        return slot;
      }

      function parseArgSlot(slotId, parentAtomId, role, opStart) {
        skipWs();
        const tok = vPeek();
        if (!tok) {
          const pos = source.length;
          return createSlot({
            id: slotId, parentAtomId, role, opStart: opStart ?? null,
            contentStart: pos, contentEnd: pos, outerStart: pos, outerEnd: pos,
            braced: false,
          });
        }
        if (tok.t === '{') {
          const openStart = tok.start;
          const contentStart = tok.end;
          state.index += 1;
          const slot = createSlot({
            id: slotId, parentAtomId, role, opStart: opStart ?? null,
            contentStart, contentEnd: contentStart, outerStart: openStart, outerEnd: contentStart,
            braced: true,
          });
          parseSequenceIntoSlot(slot, 'brace');
          skipWs();
          if (vPeek()?.t === '}') {
            const closeTok = vPeek();
            state.index += 1;
            slot.contentEnd = closeTok.start;
            slot.outerEnd = closeTok.end;
          } else {
            const endPos = vPeek() ? vPeek().start : source.length;
            slot.contentEnd = endPos;
            slot.outerEnd = endPos;
          }
          return slot;
        }
        // Unbraced single-atom argument (e.g. x^2, \int_0^1, \sqrt x)
        const atomStart = tok.start;
        const slot = createSlot({
          id: slotId, parentAtomId, role, opStart: opStart ?? null,
          contentStart: atomStart, contentEnd: atomStart, outerStart: atomStart, outerEnd: atomStart,
          braced: false,
        });
        if (tok.t !== '}' && tok.t !== '&' && !(tok.t === 'cmd' && (tok.v === '\\' || tok.v === 'end' || tok.v === 'right'))) {
          const atom = parseSingleVisualAtom(slot, slot.id + '/0');
          if (atom) {
            slot.contentEnd = atom.end;
            slot.outerEnd = atom.end;
          }
        }
        return slot;
      }

      function parseBracketSlot(slotId, parentAtomId, role) {
        skipWs();
        if (vPeek()?.t !== 'char' || vPeek()?.v !== '[') return null;
        const openTok = vPeek();
        state.index += 1;
        const slot = createSlot({
          id: slotId, parentAtomId, role, opStart: openTok.start,
          contentStart: openTok.end, contentEnd: openTok.end,
          outerStart: openTok.start, outerEnd: openTok.end,
          braced: true,
        });
        parseSequenceIntoSlot(slot, 'bracket');
        skipWs();
        if (vPeek()?.t === 'char' && vPeek()?.v === ']') {
          const closeTok = vPeek();
          state.index += 1;
          slot.contentEnd = closeTok.start;
          slot.outerEnd = closeTok.end;
        } else {
          const endPos = vPeek() ? vPeek().start : source.length;
          slot.contentEnd = endPos;
          slot.outerEnd = endPos;
        }
        return slot;
      }

      function parseSequenceIntoSlot(slot, stopMode) {
        while (state.index < tokens.length) {
          skipWs();
          const token = vPeek();
          if (!token) break;
          if (token.t === '}' || token.t === '&') break;
          if (stopMode === 'bracket' && token.t === 'char' && token.v === ']') break;
          if (stopMode === 'delimMid' && token.t === 'cmd' && token.v === 'mid') break;
          if (token.t === 'cmd' && (token.v === '\\' || token.v === 'end' || token.v === 'right')) break;

          if (token.t === 'cmd' && (token.v === 'limits' || token.v === 'nolimits')) {
            const prev = slot.atoms[slot.atoms.length - 1];
            if (prev && (prev.type === 'bigop' || prev.type === 'integral' || prev.type === 'mathop')) {
              prev.limits = token.v === 'nolimits' ? 'side' : 'stack';
              prev.end = token.end;
            }
            state.index += 1;
            continue;
          }

          if (token.t === '^' || token.t === '_') {
            const opTok = token;
            state.index += 1;
            const prev = slot.atoms[slot.atoms.length - 1];
            const canAttachDirectly = prev && (
              prev.type === 'bigop' || prev.type === 'integral' || prev.type === 'mathop' || prev.type === 'script' ||
              prev.type === 'brace' || (prev.type === 'accent' && (prev.mark === '⎴' || prev.mark === '⎵'))
            ) && (opTok.t === '^' ? !prev.supSlotId : !prev.subSlotId);

            if (canAttachDirectly) {
              const role = opTok.t === '^' ? 'sup' : 'sub';
              const scriptSlot = parseArgSlot(prev.id + '/' + role, prev.id, role, opTok.start);
              if (opTok.t === '^') prev.supSlotId = scriptSlot.id;
              else prev.subSlotId = scriptSlot.id;
              rebuildScriptChildSlots(prev);
              prev.end = Math.max(prev.end, scriptSlot.outerEnd);
              continue;
            }

            // Wrap previous atom (or create an empty base slot if none exists) into a script atom.
            const atomId = slot.id + '/' + (prev ? prev.indexInSlot : slot.atoms.length);
            let baseSlotId = null;
            let baseAtom = null;
            let scriptStart = opTok.start;

            if (prev) {
              slot.atoms.pop();
              doc.atoms.delete(prev.id);
              scriptStart = prev.start;
              if (prev.type === 'group') {
                baseSlotId = prev.bodySlotId;
                const bSlot = doc.slots.get(baseSlotId);
                if (bSlot) bSlot.parentAtomId = atomId;
              } else {
                baseAtom = prev;
              }
            } else {
              const bSlot = createSlot({
                id: atomId + '/base',
                parentAtomId: atomId,
                role: 'base',
                contentStart: opTok.start,
                contentEnd: opTok.start,
                outerStart: opTok.start,
                outerEnd: opTok.start,
                braced: false,
              });
              baseSlotId = bSlot.id;
            }

            const role = opTok.t === '^' ? 'sup' : 'sub';
            const scriptSlot = parseArgSlot(atomId + '/' + role, atomId, role, opTok.start);
            const scriptAtom = registerAtom(slot, {
              id: atomId,
              type: 'script',
              baseSlotId,
              baseAtom,
              supSlotId: opTok.t === '^' ? scriptSlot.id : null,
              subSlotId: opTok.t === '_' ? scriptSlot.id : null,
              start: scriptStart,
              end: scriptSlot.outerEnd,
              childSlots: [],
            });
            if (baseAtom) {
              for (const cid of baseAtom.childSlots) {
                const cSlot = doc.slots.get(cid);
                if (cSlot) cSlot.parentAtomId = scriptAtom.id;
              }
            }
            rebuildScriptChildSlots(scriptAtom);
            continue;
          }

          const atomId = slot.id + '/' + slot.atoms.length;
          const before = state.index;
          const atom = parseSingleVisualAtom(slot, atomId);
          if (atom) registerAtom(slot, atom);
          else if (state.index === before) state.index += 1;
        }
      }

      function rebuildScriptChildSlots(atom) {
        const list = [];
        if (atom.type === 'script') {
          if (atom.baseSlotId) list.push(atom.baseSlotId);
          else if (atom.baseAtom) list.push(...atom.baseAtom.childSlots);
        } else if (atom.type === 'mathop' && atom.bodySlotId) {
          list.push(atom.bodySlotId);
        } else if ((atom.type === 'brace' || atom.type === 'accent') && atom.bodySlotId) {
          list.push(atom.bodySlotId);
        }
        if (atom.subSlotId) list.push(atom.subSlotId);
        if (atom.supSlotId) list.push(atom.supSlotId);
        atom.childSlots = list;
      }

      function parseSingleVisualAtom(parentSlot, atomId) {
        skipWs();
        const token = vPeek();
        if (!token) return null;

        if (token.t === '{') {
          const openTok = token;
          state.index += 1;
          const bodySlot = createSlot({
            id: atomId + '/body',
            parentAtomId: atomId,
            role: 'body',
            contentStart: openTok.end,
            contentEnd: openTok.end,
            outerStart: openTok.start,
            outerEnd: openTok.end,
            braced: true,
          });
          parseSequenceIntoSlot(bodySlot, 'brace');
          skipWs();
          let endPos = vPeek() ? vPeek().start : source.length;
          if (vPeek()?.t === '}') {
            const closeTok = vPeek();
            state.index += 1;
            bodySlot.contentEnd = closeTok.start;
            bodySlot.outerEnd = closeTok.end;
            endPos = closeTok.end;
          } else {
            bodySlot.contentEnd = endPos;
            bodySlot.outerEnd = endPos;
          }
          bodySlot.skipTab = bodySlot.atoms.length > 0;
          return {
            id: atomId,
            type: 'group',
            bodySlotId: bodySlot.id,
            start: openTok.start,
            end: endPos,
            childSlots: [bodySlot.id],
          };
        }

        if (token.t === 'char') {
          state.index += 1;
          return { id: atomId, type: 'text', v: token.v, start: token.start, end: token.end, childSlots: [] };
        }

        if (token.t === 'cmd') {
          state.index += 1;
          return parseVisualCommand(atomId, token);
        }

        return null;
      }

      function parseVisualCommand(atomId, cmdToken) {
        const name = cmdToken.v;
        const start = cmdToken.start;

        // Atomic palette wrappers (\mathrel{...}, \mathbin{...}, \mathinner{...})
        if (name === 'mathrel' || name === 'mathbin' || name === 'mathinner') {
          const range = consumeBalancedBraces();
          const end = range ? range.outerEnd : cmdToken.end;
          const slice = source.slice(start, end);
          return {
            id: atomId,
            type: 'atomic',
            previewNodes: parseLatex(slice),
            start,
            end,
            childSlots: [],
          };
        }

        if (name === 'mathop') {
          const savedIdx = state.index;
          const range = consumeBalancedBraces();
          if (range) {
            const innerRaw = source.slice(range.contentStart, range.contentEnd).trim();
            const textMatch = /^\\text\{([^}]*)\}$/.exec(innerRaw);
            const glyph = textMatch ? textMatch[1] : innerRaw;
            if (glyph === '⨅' || glyph === '⨉') {
              return { id: atomId, type: 'bigop', ch: glyph, limits: 'stack', supSlotId: null, subSlotId: null, start, end: range.outerEnd, childSlots: [] };
            }
            if (['⨌', '⨏', '∲', '∳', '⨋', '∱'].includes(glyph)) {
              return { id: atomId, type: 'integral', ch: glyph, limits: 'side', supSlotId: null, subSlotId: null, start, end: range.outerEnd, childSlots: [] };
            }
          }
          state.index = savedIdx;
          const bodySlot = parseArgSlot(atomId + '/body', atomId, 'body', null);
          return {
            id: atomId,
            type: 'mathop',
            bodySlotId: bodySlot.id,
            limits: 'stack',
            supSlotId: null,
            subSlotId: null,
            start,
            end: bodySlot.outerEnd,
            childSlots: [bodySlot.id],
          };
        }

        if (name === 'sout' || name === 'cancel' || name === 'bcancel' || name === 'xcancel' || name === 'boxed') {
          const bodySlot = parseArgSlot(atomId + '/body', atomId, 'body', null);
          return { id: atomId, type: 'decoration', decoration: name, bodySlotId: bodySlot.id, start, end: bodySlot.outerEnd, childSlots: [bodySlot.id] };
        }

        if (name === 'colorbox') {
          const colorRange = consumeBalancedBraces();
          const rawColor = colorRange ? source.slice(colorRange.contentStart, colorRange.contentEnd).trim() : '';
          const bodySlot = parseArgSlot(atomId + '/body', atomId, 'body', null);
          return {
            id: atomId,
            type: 'decoration',
            decoration: 'colorbox',
            color: /^[a-zA-Z]+$/.test(rawColor) ? rawColor : 'transparent',
            bodySlotId: bodySlot.id,
            start,
            end: bodySlot.outerEnd,
            childSlots: [bodySlot.id],
          };
        }

        if (name === 'not') {
          const savedIdx = state.index;
          skipWs();
          const nextTok = vPeek();
          if (nextTok && nextTok.t === 'cmd' && SYMBOL_CHARS[nextTok.v] !== undefined) {
            state.index += 1;
            return {
              id: atomId,
              type: 'atomic',
              previewNodes: [{ type: 'not', body: [{ type: 'sym', ch: SYMBOL_CHARS[nextTok.v] }] }],
              start,
              end: nextTok.end,
              childSlots: [],
            };
          }
          state.index = savedIdx;
          const bodySlot = parseArgSlot(atomId + '/body', atomId, 'body', null);
          return { id: atomId, type: 'not', bodySlotId: bodySlot.id, start, end: bodySlot.outerEnd, childSlots: [bodySlot.id] };
        }

        if (LABELLED_ARROWS[name] !== undefined) {
          const belowSlot = parseBracketSlot(atomId + '/below', atomId, 'below');
          const aboveSlot = parseArgSlot(atomId + '/above', atomId, 'above', null);
          const childSlots = belowSlot ? [belowSlot.id, aboveSlot.id] : [aboveSlot.id];
          return {
            id: atomId,
            type: 'xarrow',
            ch: LABELLED_ARROWS[name],
            aboveSlotId: aboveSlot.id,
            belowSlotId: belowSlot ? belowSlot.id : null,
            start,
            end: aboveSlot.outerEnd,
            childSlots,
          };
        }

        if (name === 'frac' || name === 'dfrac' || name === 'tfrac' || name === 'cfrac') {
          const numSlot = parseArgSlot(atomId + '/num', atomId, 'num', null);
          const denSlot = parseArgSlot(atomId + '/den', atomId, 'den', null);
          return { id: atomId, type: 'frac', numSlotId: numSlot.id, denSlotId: denSlot.id, start, end: denSlot.outerEnd, childSlots: [numSlot.id, denSlot.id] };
        }

        if (name === 'binom' || name === 'dbinom' || name === 'tbinom') {
          const topSlot = parseArgSlot(atomId + '/top', atomId, 'top', null);
          const bottomSlot = parseArgSlot(atomId + '/bottom', atomId, 'bottom', null);
          return { id: atomId, type: 'binom', topSlotId: topSlot.id, bottomSlotId: bottomSlot.id, start, end: bottomSlot.outerEnd, childSlots: [topSlot.id, bottomSlot.id] };
        }

        if (name === 'hspace' || name === 'vspace' || name === 'mspace') {
          const lenSlot = parseTextSlot(atomId + '/len', atomId, 'text');
          return { id: atomId, type: 'hspace', cmd: name, bodySlotId: lenSlot.id, start, end: lenSlot.outerEnd, childSlots: [lenSlot.id] };
        }

        if (name === 'sqrt') {
          const indexSlot = parseBracketSlot(atomId + '/index', atomId, 'index');
          const bodySlot = parseArgSlot(atomId + '/radicand', atomId, 'radicand', null);
          const childSlots = indexSlot ? [indexSlot.id, bodySlot.id] : [bodySlot.id];
          return {
            id: atomId,
            type: 'sqrt',
            indexSlotId: indexSlot ? indexSlot.id : null,
            bodySlotId: bodySlot.id,
            start,
            end: bodySlot.outerEnd,
            childSlots,
          };
        }

        if (name === 'left') {
          return parseVisualLeftRight(atomId, start);
        }

        if (name === 'begin') {
          return parseVisualEnvironment(atomId, start);
        }

        if (name === 'text' || name === 'textbf' || name === 'textit' || name === 'mbox') {
          const savedIdx = state.index;
          const range = consumeBalancedBraces();
          if (range) {
            const rawInner = source.slice(range.contentStart, range.contentEnd);
            if (SINGLE_GLYPH_TEXT_SYMS.has(rawInner)) {
              return { id: atomId, type: 'sym', ch: rawInner, start, end: range.outerEnd, childSlots: [] };
            }
            if (name === 'text' && UPRIGHT_GREEK_GLYPHS.has(rawInner)) {
              return { id: atomId, type: 'sym', ch: rawInner, upright: true, start, end: range.outerEnd, childSlots: [] };
            }
          }
          state.index = savedIdx;
          const textSlot = parseTextSlot(atomId + '/text', atomId, 'text');
          return { id: atomId, type: 'textstyle', cmd: name, bodySlotId: textSlot.id, start, end: textSlot.outerEnd, childSlots: [textSlot.id] };
        }

        if (name === 'overline' || name === 'underline') {
          const savedIdx = state.index;
          skipWs();
          // Detect long division \overline{)...}
          if (name === 'overline' && vPeek()?.t === '{') {
            const openBrace = vPeek();
            if (tokens[state.index + 1]?.t === 'char' && tokens[state.index + 1]?.v === ')') {
              const parenTok = tokens[state.index + 1];
              state.index += 2; // consume '{' and ')'
              skipWs();
              // If content after ')' is a single braced group `{}`, adopt its inner bounds directly
              let divSlot;
              if (vPeek()?.t === '{') {
                const innerOpen = vPeek();
                state.index += 1;
                divSlot = createSlot({
                  id: atomId + '/dividend',
                  parentAtomId: atomId,
                  role: 'body',
                  contentStart: innerOpen.end,
                  contentEnd: innerOpen.end,
                  outerStart: innerOpen.start,
                  outerEnd: innerOpen.end,
                  braced: true,
                });
                parseSequenceIntoSlot(divSlot, 'brace');
                skipWs();
                if (vPeek()?.t === '}') {
                  const innerClose = vPeek();
                  state.index += 1;
                  divSlot.contentEnd = innerClose.start;
                  divSlot.outerEnd = innerClose.end;
                }
                skipWs();
                let outerEnd = divSlot.outerEnd;
                if (vPeek()?.t === '}') {
                  outerEnd = vPeek().end;
                  state.index += 1;
                }
                return { id: atomId, type: 'longdiv', bodySlotId: divSlot.id, start, end: outerEnd, childSlots: [divSlot.id] };
              }
              divSlot = createSlot({
                id: atomId + '/dividend',
                parentAtomId: atomId,
                role: 'body',
                contentStart: parenTok.end,
                contentEnd: parenTok.end,
                outerStart: openBrace.start,
                outerEnd: parenTok.end,
                braced: true,
              });
              parseSequenceIntoSlot(divSlot, 'brace');
              skipWs();
              let outerEnd = vPeek() ? vPeek().start : source.length;
              if (vPeek()?.t === '}') {
                const closeTok = vPeek();
                state.index += 1;
                divSlot.contentEnd = closeTok.start;
                divSlot.outerEnd = closeTok.end;
                outerEnd = closeTok.end;
              } else {
                divSlot.contentEnd = outerEnd;
                divSlot.outerEnd = outerEnd;
              }
              return { id: atomId, type: 'longdiv', bodySlotId: divSlot.id, start, end: outerEnd, childSlots: [divSlot.id] };
            }
          }
          state.index = savedIdx;
          const bodySlot = parseArgSlot(atomId + '/body', atomId, 'body', null);
          return { id: atomId, type: 'line', position: name === 'overline' ? 'top' : 'bottom', bodySlotId: bodySlot.id, start, end: bodySlot.outerEnd, childSlots: [bodySlot.id] };
        }

        if (name === 'overbrace' || name === 'underbrace') {
          const bodySlot = parseArgSlot(atomId + '/body', atomId, 'body', null);
          return {
            id: atomId,
            type: 'brace',
            position: name === 'overbrace' ? 'top' : 'bottom',
            bodySlotId: bodySlot.id,
            supSlotId: null,
            subSlotId: null,
            start,
            end: bodySlot.outerEnd,
            childSlots: [bodySlot.id],
          };
        }

        if (name === 'phantom' || name === 'hphantom' || name === 'vphantom') {
          const bodySlot = parseArgSlot(atomId + '/body', atomId, 'body', null);
          return { id: atomId, type: 'phantom', mode: name, bodySlotId: bodySlot.id, start, end: bodySlot.outerEnd, childSlots: [bodySlot.id] };
        }

        if (name === 'overset' || name === 'underset') {
          const topSlot = parseArgSlot(atomId + '/over', atomId, name === 'overset' ? 'over' : 'under', null);
          const baseSlot = parseArgSlot(atomId + '/base', atomId, 'base', null);
          // Mark fixed accent/arrow slots so Tab skips them and focuses user-editable placeholders.
          const topRaw = source.slice(topSlot.contentStart, topSlot.contentEnd).trim();
          const baseRaw = source.slice(baseSlot.contentStart, baseSlot.contentEnd).trim();
          if (topSlot.atoms.length > 0 && /^(\\[a-zA-Z]+|-|\\text\{['`]\})+$/.test(topRaw)) {
            topSlot.skipTab = true;
          }
          if (baseSlot.atoms.length === 1 && (baseSlot.atoms[0].type === 'atomic' || baseRaw === '\\_')) {
            baseSlot.skipTab = true;
            if (baseSlot.atoms[0].type === 'atomic') baseSlot.readOnly = true;
          }
          const childSlots = [];
          if (!topSlot.readOnly) childSlots.push(topSlot.id);
          if (!baseSlot.readOnly) childSlots.push(baseSlot.id);
          return {
            id: atomId,
            type: 'stack',
            position: name === 'overset' ? 'over' : 'under',
            topSlotId: topSlot.id,
            baseSlotId: baseSlot.id,
            start,
            end: baseSlot.outerEnd,
            childSlots,
          };
        }

        const wideAccentMap = {
          overgroup: ['⏠', false],
          undergroup: ['⏡', true],
          utilde: ['˜', true],
          overbracket: ['⎴', false],
          underbracket: ['⎵', true],
          underleftarrow: ['←', true],
          underleftrightarrow: ['↔', true],
          underrightharpoon: ['⇀', true],
          overrightharpoon: ['⇀', false],
          overleftharpoon: ['↼', false],
          underrightarrow: ['→', true],
          widehat: ['ˆ', false],
          widecheck: ['ˇ', false],
          widetilde: ['˜', false],
          overrightarrow: ['→', false],
          overleftarrow: ['←', false],
          overleftrightarrow: ['↔', false],
        };
        if (wideAccentMap[name] !== undefined || ACCENT_MARKS[name] !== undefined) {
          const isWide = wideAccentMap[name] !== undefined;
          const mark = isWide ? wideAccentMap[name][0] : ACCENT_MARKS[name];
          const below = isWide ? wideAccentMap[name][1] : false;
          const bodySlot = parseArgSlot(atomId + '/body', atomId, 'body', null);
          return {
            id: atomId,
            type: 'accent',
            mark,
            below,
            wide: isWide,
            bodySlotId: bodySlot.id,
            supSlotId: null,
            subSlotId: null,
            start,
            end: bodySlot.outerEnd,
            childSlots: [bodySlot.id],
          };
        }

        if (FONT_COMMANDS[name] !== undefined) {
          const ATOMIC_FONT_CMDS = new Set(['mathbb', 'mathscr', 'mathcal', 'mathfrak', 'boldsymbol']);
          if (ATOMIC_FONT_CMDS.has(name)) {
            const savedIdx = state.index;
            const range = consumeBalancedBraces();
            if (range) {
              const rawInner = source.slice(range.contentStart, range.contentEnd).trim();
              // Atomic single-glyph font symbols from palette (\mathbb{A}, \mathscr{A}, \mathfrak{a}, \boldsymbol{\mathscr{A}}, \boldsymbol{\uparrow})
              if (/^[a-zA-Z]$/.test(rawInner) || /^\\(mathscr|mathcal|mathbb|mathfrak)\{[a-zA-Z]\}$/.test(rawInner) ||
                  /^\\[a-zA-Z]+$/.test(rawInner)) {
                const previewNodes = parseLatex(source.slice(start, range.outerEnd));
                if (previewNodes.length === 1 && rawInner !== '') {
                  return { id: atomId, type: 'atomic', previewNodes, start, end: range.outerEnd, childSlots: [] };
                }
              }
            }
            state.index = savedIdx;
          }
          if (name === 'operatorname') {
            const opSlot = parseTextSlot(atomId + '/op', atomId, 'text');
            return { id: atomId, type: 'operatorname', bodySlotId: opSlot.id, start, end: opSlot.outerEnd, childSlots: [opSlot.id] };
          }
          const font = FONT_COMMANDS[name];
          const bodySlot = parseArgSlot(atomId + '/font', atomId, 'body', null);
          if ((name === 'mathrm' || name === 'mathit') && bodySlot.atoms.length > 0) {
            bodySlot.skipTab = true;
          }
          return { id: atomId, type: 'font', font, cmd: name, bodySlotId: bodySlot.id, start, end: bodySlot.outerEnd, childSlots: [bodySlot.id] };
        }

        if (BIG_OPERATORS.has(name)) {
          return { id: atomId, type: 'bigop', ch: SYMBOL_CHARS[name] || name, limits: 'stack', supSlotId: null, subSlotId: null, start, end: cmdToken.end, childSlots: [] };
        }
        if (INTEGRALS.has(name)) {
          return { id: atomId, type: 'integral', ch: SYMBOL_CHARS[name] || '∫', limits: 'side', supSlotId: null, subSlotId: null, start, end: cmdToken.end, childSlots: [] };
        }
        if (FUNCTION_NAMES.has(name)) {
          return { id: atomId, type: 'func', name: name === 'liminf' ? 'lim inf' : name === 'limsup' ? 'lim sup' : name, start, end: cmdToken.end, childSlots: [] };
        }
        if (name === 'quad') return { id: atomId, type: 'space', w: '1em', label: '1M', start, end: cmdToken.end, childSlots: [] };
        if (name === 'qquad') return { id: atomId, type: 'space', w: '2em', label: '2M', start, end: cmdToken.end, childSlots: [] };
        if (name === ',') return { id: atomId, type: 'space', w: '0.17em', label: '3', start, end: cmdToken.end, childSlots: [] };
        if (name === ':') return { id: atomId, type: 'space', w: '0.22em', label: '4', start, end: cmdToken.end, childSlots: [] };
        if (name === ';') return { id: atomId, type: 'space', w: '0.28em', label: '5', start, end: cmdToken.end, childSlots: [] };
        if (name === '!') return { id: atomId, type: 'space', w: '-0.12em', label: '-3', start, end: cmdToken.end, childSlots: [] };
        if (name === ' ') return { id: atomId, type: 'space', w: '0.35em', label: '␣', start, end: cmdToken.end, childSlots: [] };
        if (name === '{' || name === '}' || name === '%' || name === '&' || name === '#' || name === '_' || name === '$') {
          return { id: atomId, type: 'text', v: name, start, end: cmdToken.end, childSlots: [] };
        }
        if (name === '|') return { id: atomId, type: 'text', v: '‖', start, end: cmdToken.end, childSlots: [] };
        if (SYMBOL_CHARS[name] !== undefined) {
          return {
            id: atomId,
            type: 'sym',
            ch: SYMBOL_CHARS[name],
            italic: VAR_GREEK_TO_UPRIGHT[name] !== undefined,
            start,
            end: cmdToken.end,
            childSlots: [],
          };
        }
        return { id: atomId, type: 'text', v: '\\' + name, unknown: true, start, end: cmdToken.end, childSlots: [] };
      }

      function readVisualDelimiter() {
        skipWs();
        const tok = vPeek();
        if (!tok) return { ch: '', end: source.length };
        state.index += 1;
        if (tok.t === 'char') return { ch: DELIMITER_CHARS[tok.v] !== undefined ? DELIMITER_CHARS[tok.v] : tok.v, end: tok.end };
        if (tok.t === 'cmd') return { ch: DELIMITER_CHARS[tok.v] !== undefined ? DELIMITER_CHARS[tok.v] : '', end: tok.end };
        return { ch: '', end: tok.end };
      }

      function parseVisualLeftRight(atomId, start) {
        const leftInfo = readVisualDelimiter();
        let left = leftInfo.ch;
        let innerStart = leftInfo.end;
        let doubleLeft = false;
        let doubleEmptyLeft = false;

        // Detect \left[\!\left[ or \left.\left.
        const saved = state.index;
        skipWs();
        if (left === '[' &&
            tokens[state.index]?.t === 'cmd' && tokens[state.index]?.v === '!' &&
            tokens[state.index + 1]?.t === 'cmd' && tokens[state.index + 1]?.v === 'left' &&
            tokens[state.index + 2]?.t === 'char' && tokens[state.index + 2]?.v === '[') {
          innerStart = tokens[state.index + 2].end;
          state.index += 3;
          left = '⟦';
          doubleLeft = true;
        } else if (left === '' &&
            tokens[state.index]?.t === 'cmd' && tokens[state.index]?.v === 'left' &&
            tokens[state.index + 1]?.t === 'char' && tokens[state.index + 1]?.v === '.') {
          innerStart = tokens[state.index + 1].end;
          state.index += 2;
          doubleEmptyLeft = true;
        } else {
          state.index = saved;
        }

        // Check if top-level \mid divides this delimiter pair (e.g. \left[@\mid{}\right])
        const bodySlot = createSlot({
          id: atomId + '/body',
          parentAtomId: atomId,
          role: 'body',
          contentStart: innerStart,
          contentEnd: innerStart,
          outerStart: innerStart,
          outerEnd: innerStart,
          braced: true,
        });
        parseSequenceIntoSlot(bodySlot, 'delimMid');
        skipWs();

        let midSlot = null;
        if (vPeek()?.t === 'cmd' && vPeek()?.v === 'mid') {
          const midTok = vPeek();
          bodySlot.contentEnd = midTok.start;
          bodySlot.outerEnd = midTok.start;
          state.index += 1; // consume \mid
          skipWs();
          // If after \mid is a single braced group `{...}`, adopt its inner bounds so no double placeholder box appears
          const afterMidStart = midTok.end;
          const savedAfterMid = state.index;
          if (vPeek()?.t === '{') {
            const braceOpen = vPeek();
            state.index += 1;
            const candidateSlot = createSlot({
              id: atomId + '/right',
              parentAtomId: atomId,
              role: 'body',
              contentStart: braceOpen.end,
              contentEnd: braceOpen.end,
              outerStart: braceOpen.start,
              outerEnd: braceOpen.end,
              braced: true,
            });
            parseSequenceIntoSlot(candidateSlot, 'brace');
            skipWs();
            if (vPeek()?.t === '}') {
              const braceClose = vPeek();
              state.index += 1;
              candidateSlot.contentEnd = braceClose.start;
              candidateSlot.outerEnd = braceClose.end;
              skipWs();
              if (!vPeek() || (vPeek().t === 'cmd' && vPeek().v === 'right')) {
                midSlot = candidateSlot;
              }
            }
            if (!midSlot) {
              doc.slots.delete(candidateSlot.id);
              doc.slotOrder.pop();
              state.index = savedAfterMid;
            }
          }
          if (!midSlot) {
            midSlot = createSlot({
              id: atomId + '/right',
              parentAtomId: atomId,
              role: 'body',
              contentStart: afterMidStart,
              contentEnd: afterMidStart,
              outerStart: afterMidStart,
              outerEnd: afterMidStart,
              braced: true,
            });
            parseSequenceIntoSlot(midSlot, 'brace');
          }
        }

        skipWs();
        let right = '';
        let endPos = vPeek() ? vPeek().start : source.length;
        const tailSlot = midSlot || bodySlot;
        if (!midSlot || tailSlot.outerEnd === tailSlot.contentStart) {
          tailSlot.contentEnd = endPos;
          tailSlot.outerEnd = endPos;
        }
        if (vPeek()?.t === 'cmd' && vPeek()?.v === 'right') {
          const rightCmdTok = vPeek();
          if (!midSlot) {
            bodySlot.contentEnd = rightCmdTok.start;
            bodySlot.outerEnd = rightCmdTok.start;
          } else if (midSlot.outerStart === midSlot.contentStart) {
            midSlot.contentEnd = rightCmdTok.start;
            midSlot.outerEnd = rightCmdTok.start;
          }
          state.index += 1;
          const rightInfo = readVisualDelimiter();
          right = rightInfo.ch;
          endPos = rightInfo.end;

          if ((doubleLeft || doubleEmptyLeft) && right === ']') {
            const s2 = state.index;
            skipWs();
            if (tokens[state.index]?.t === 'cmd' && tokens[state.index]?.v === '!' &&
                tokens[state.index + 1]?.t === 'cmd' && tokens[state.index + 1]?.v === 'right' &&
                tokens[state.index + 2]?.t === 'char' && tokens[state.index + 2]?.v === ']') {
              endPos = tokens[state.index + 2].end;
              state.index += 3;
              right = '⟧';
            } else {
              state.index = s2;
            }
          } else if (doubleLeft && right === '') {
            const s2 = state.index;
            skipWs();
            if (tokens[state.index]?.t === 'cmd' && tokens[state.index]?.v === 'right' &&
                tokens[state.index + 1]?.t === 'char' && tokens[state.index + 1]?.v === '.') {
              endPos = tokens[state.index + 1].end;
              state.index += 2;
            } else {
              state.index = s2;
            }
          }
        }

        return {
          id: atomId,
          type: 'delim',
          left,
          right,
          bodySlotId: bodySlot.id,
          midSlotId: midSlot ? midSlot.id : null,
          start,
          end: endPos,
          childSlots: midSlot ? [bodySlot.id, midSlot.id] : [bodySlot.id],
        };
      }

      function parseVisualEnvironment(atomId, start) {
        const envRange = consumeBalancedBraces();
        const env = envRange ? source.slice(envRange.contentStart, envRange.contentEnd).trim() : 'matrix';
        let alignment = '';
        let bodyStart = envRange ? envRange.outerEnd : start;
        if (env === 'array') {
          const saved = state.index;
          skipWs();
          if (vPeek()?.t === '{') {
            const alignRange = consumeBalancedBraces();
            if (alignRange) {
              alignment = source.slice(alignRange.contentStart, alignRange.contentEnd).replace(/[^lcr]/g, '');
              bodyStart = alignRange.outerEnd;
            }
          } else {
            state.index = saved;
          }
        }

        // Partition environment tokens into [cellStart, cellEnd] ranges by top-level & and \\
        const rawRows = [];
        let curRow = [];
        let cellStart = bodyStart;
        let braceDepth = 0;
        let leftDepth = 0;
        let beginDepth = 0;
        let endOuter = source.length;
        let hasContentInCurrentCell = false;

        while (state.index < tokens.length) {
          const tk = tokens[state.index];
          if (tk.t === '{') {
            braceDepth += 1;
            hasContentInCurrentCell = true;
            state.index += 1;
            continue;
          }
          if (tk.t === '}') {
            if (braceDepth > 0) braceDepth -= 1;
            state.index += 1;
            continue;
          }
          if (tk.t === 'cmd' && tk.v === 'left') {
            leftDepth += 1;
            hasContentInCurrentCell = true;
            state.index += 1;
            continue;
          }
          if (tk.t === 'cmd' && tk.v === 'right') {
            if (leftDepth > 0) leftDepth -= 1;
            state.index += 1;
            continue;
          }
          if (tk.t === 'cmd' && tk.v === 'begin') {
            beginDepth += 1;
            hasContentInCurrentCell = true;
            state.index += 1;
            continue;
          }
          if (tk.t === 'cmd' && tk.v === 'end') {
            if (beginDepth > 0) {
              beginDepth -= 1;
              state.index += 1;
              consumeBalancedBraces();
              continue;
            }
            const cellEnd = tk.start;
            if (hasContentInCurrentCell || curRow.length > 0 || rawRows.length === 0) {
              curRow.push([cellStart, cellEnd]);
              rawRows.push(curRow);
            }
            state.index += 1;
            const closeEnv = consumeBalancedBraces();
            endOuter = closeEnv ? closeEnv.outerEnd : tk.end;
            curRow = null;
            break;
          }
          if (braceDepth === 0 && leftDepth === 0 && beginDepth === 0) {
            if (tk.t === '&') {
              curRow.push([cellStart, tk.start]);
              cellStart = tk.end;
              hasContentInCurrentCell = false;
              state.index += 1;
              continue;
            }
            if (tk.t === 'cmd' && tk.v === '\\') {
              curRow.push([cellStart, tk.start]);
              rawRows.push(curRow);
              curRow = [];
              cellStart = tk.end;
              hasContentInCurrentCell = false;
              state.index += 1;
              continue;
            }
          }
          if (tk.t !== 'ws') hasContentInCurrentCell = true;
          state.index += 1;
        }
        if (curRow !== null && (hasContentInCurrentCell || curRow.length > 0 || rawRows.length === 0)) {
          curRow.push([cellStart, source.length]);
          rawRows.push(curRow);
        }

        const afterMatrixIndex = state.index;
        const rowSlotIds = [];
        const allCellSlotIds = [];

        for (let r = 0; r < rawRows.length; r += 1) {
          const rIds = [];
          for (let c = 0; c < rawRows[r].length; c += 1) {
            const [cStart, cEnd] = rawRows[r][c];
            const cellId = `${atomId}/cell-${r}-${c}`;
            const rawCell = source.slice(cStart, cEnd);
            const emptyBraceMatch = /^\s*\{\s*\}\s*$/.exec(rawCell);
            const cellSlot = createSlot({
              id: cellId,
              parentAtomId: atomId,
              role: 'cell',
              contentStart: cStart,
              contentEnd: cEnd,
              outerStart: cStart,
              outerEnd: cEnd,
              braced: true,
              isMatrixCell: true,
              row: r,
              col: c,
            });
            if (!emptyBraceMatch) {
              // Parse tokens inside [cStart, cEnd]
              let firstTokIdx = tokens.findIndex((tk) => tk.start >= cStart && tk.end <= cEnd);
              if (firstTokIdx >= 0) {
                state.index = firstTokIdx;
                while (state.index < tokens.length && tokens[state.index].end <= cEnd) {
                  skipWs();
                  if (state.index >= tokens.length || tokens[state.index].end > cEnd) break;
                  const tk = tokens[state.index];
                  if (tk.t === '^' || tk.t === '_' || tk.t === 'cmd' || tk.t === 'char' || tk.t === '{') {
                    // Temporarily cap tokens via slice boundary check in parseSequenceIntoSlot
                    break;
                  }
                  state.index += 1;
                }
                // Parse clean sub-document for cell tokens by slicing tokens <= cEnd
                const endTokIdx = tokens.findIndex((tk) => tk.start >= cEnd);
                const savedLen = tokens.length;
                const cutAt = endTokIdx === -1 ? savedLen : endTokIdx;
                const tailRemoved = tokens.splice(cutAt);
                state.index = firstTokIdx;
                parseSequenceIntoSlot(cellSlot, 'cell');
                tokens.push(...tailRemoved);
              }
            }
            rIds.push(cellId);
            allCellSlotIds.push(cellId);
          }
          rowSlotIds.push(rIds);
        }

        state.index = afterMatrixIndex;
        return {
          id: atomId,
          type: 'matrix',
          env,
          alignment,
          rowSlotIds,
          start,
          end: endOuter,
          childSlots: allCellSlotIds,
        };
      }

      const rootSlot = createSlot({
        id: 'root',
        parentAtomId: null,
        role: 'root',
        contentStart: 0,
        contentEnd: source.length,
        outerStart: 0,
        outerEnd: source.length,
        braced: true,
      });
      parseSequenceIntoSlot(rootSlot, 'root');

      function collectStops(slotId) {
        const slot = doc.slots.get(slotId);
        if (!slot || slot.readOnly) return;
        const pAtom = slot.parentAtomId ? doc.atoms.get(slot.parentAtomId) : null;
        const isInlineFontBody = Boolean(
          pAtom && pAtom.type === 'font' && (pAtom.cmd === 'mathrm' || pAtom.cmd === 'mathit') &&
          slot.id === pAtom.bodySlotId && slot.atoms.length > 0
        );
        if (!isInlineFontBody && !(slot.atoms.length > 0 && slot.atoms[0].type === 'group')) {
          doc.stops.push({ slotId, index: 0 });
        }
        for (let i = 0; i < slot.atoms.length; i += 1) {
          const atom = slot.atoms[i];
          for (const childId of atom.childSlots) {
            collectStops(childId);
          }
          const isEndOfInlineFont = isInlineFontBody && i + 1 === slot.atoms.length;
          const nextAtom = slot.atoms[i + 1];
          if (!isEndOfInlineFont && !(nextAtom && nextAtom.type === 'group')) {
            doc.stops.push({ slotId, index: i + 1 });
          }
        }
      }
      collectStops('root');
      if (doc.stops.length === 0) doc.stops.push({ slotId: 'root', index: 0 });

      return doc;
    }

    function normalizeVisualCursor(doc, cursor) {
      if (!cursor || !doc.slots.has(cursor.slotId)) {
        const root = doc.slots.get('root');
        return { slotId: 'root', index: root ? root.atoms.length : 0, anchor: null };
      }
      const slot = doc.slots.get(cursor.slotId);
      const index = Math.max(0, Math.min(slot.atoms.length, cursor.index));
      const anchor = typeof cursor.anchor === 'number'
        ? Math.max(0, Math.min(slot.atoms.length, cursor.anchor))
        : null;
      return { slotId: slot.id, index, anchor: anchor === index ? null : anchor };
    }

    function offsetToVisualCursor(doc, offset) {
      const clamped = Math.max(0, Math.min(doc.source.length, offset));
      let bestSlot = doc.slots.get('root');
      let bestSpan = Infinity;
      for (const slot of doc.slots.values()) {
        if (slot.readOnly) continue;
        if (slot.braced && slot.contentStart <= clamped && clamped <= slot.contentEnd) {
          const span = slot.contentEnd - slot.contentStart;
          if (span <= bestSpan) {
            bestSpan = span;
            bestSlot = slot;
          }
        }
      }
      if (!bestSlot) return { slotId: 'root', index: 0, anchor: null };
      let idx = 0;
      for (let i = 0; i < bestSlot.atoms.length; i += 1) {
        const atom = bestSlot.atoms[i];
        if (clamped <= atom.start) {
          idx = i;
          break;
        }
        idx = i + 1;
        if (clamped < atom.end) break;
      }
      // If landing directly at a group atom boundary, step inside if empty
      if (idx < bestSlot.atoms.length && bestSlot.atoms[idx].type === 'group') {
        const gSlot = doc.slots.get(bestSlot.atoms[idx].bodySlotId);
        if (gSlot && gSlot.atoms.length === 0) return { slotId: gSlot.id, index: 0, anchor: null };
      }
      return { slotId: bestSlot.id, index: idx, anchor: null };
    }

    function visualCursorToOffset(doc, cursor) {
      const norm = normalizeVisualCursor(doc, cursor);
      const slot = doc.slots.get(norm.slotId);
      if (!slot) return doc.source.length;
      if (slot.atoms.length === 0) return slot.contentStart;
      if (norm.index <= 0) return slot.atoms[0].start;
      if (norm.index >= slot.atoms.length) return slot.atoms[slot.atoms.length - 1].end;
      return slot.atoms[norm.index].start;
    }

    function selectedBounds(cursor) {
      if (cursor.anchor === null || cursor.anchor === undefined || cursor.anchor === cursor.index) {
        return [cursor.index, cursor.index];
      }
      return cursor.anchor < cursor.index ? [cursor.anchor, cursor.index] : [cursor.index, cursor.anchor];
    }

    function getSelectedVisualLatex(doc, cursor) {
      const norm = normalizeVisualCursor(doc, cursor);
      const [s, e] = selectedBounds(norm);
      if (s === e) return '';
      const slot = doc.slots.get(norm.slotId);
      if (!slot || slot.atoms.length === 0) return '';
      return doc.source.slice(slot.atoms[s].start, slot.atoms[e - 1].end);
    }

    function editSlotRange(doc, slotId, startIdx, endIdx, midLatexWithMarker) {
      const slot = doc.slots.get(slotId);
      if (!slot) return { latex: doc.source, cursor: { slotId: 'root', index: 0, anchor: null } };

      const s = Math.max(0, Math.min(slot.atoms.length, startIdx));
      const e = Math.max(s, Math.min(slot.atoms.length, endIdx));
      const rightAtomCount = slot.atoms.length - e;

      const leftPart = s === 0 ? '' : doc.source.slice(slot.atoms[0].start, slot.atoms[s - 1].end);
      const rightPart = e >= slot.atoms.length ? '' : doc.source.slice(slot.atoms[e].start, slot.atoms[slot.atoms.length - 1].end);

      const markerIdx = midLatexWithMarker.indexOf('@');
      const midClean = markerIdx >= 0
        ? midLatexWithMarker.slice(0, markerIdx) + midLatexWithMarker.slice(markerIdx + 1).replace(/@/g, '')
        : midLatexWithMarker;

      let innerBeforeMarker = '';
      let newInner = '';
      if (slot.isTextSlot) {
        innerBeforeMarker = leftPart + (markerIdx >= 0 ? midClean.slice(0, markerIdx) : midClean);
        newInner = leftPart + midClean + rightPart;
      } else {
        if (markerIdx >= 0) {
          const preMid = midClean.slice(0, markerIdx);
          const postMid = midClean.slice(markerIdx);
          const leftPlusPre = joinLatexParts(leftPart, preMid, '');
          innerBeforeMarker = leftPlusPre;
          newInner = joinLatexParts(leftPlusPre, postMid, rightPart);
        } else {
          const leftPlusMid = joinLatexParts(leftPart, midClean, '');
          innerBeforeMarker = leftPlusMid;
          newInner = joinLatexParts(leftPlusMid, '', rightPart);
        }
      }

      let clearedMatrixPlaceholder = false;
      if (slot.isMatrixCell && newInner.trim() === '') {
        newInner = '{}';
        clearedMatrixPlaceholder = true;
      }

      let nextLatex;
      let caretOffsetInNext;
      if (slot.braced) {
        const prefix = doc.source.slice(0, slot.contentStart);
        const suffix = doc.source.slice(slot.contentEnd);
        if (slot.isTextSlot) {
          nextLatex = prefix + newInner + suffix;
          caretOffsetInNext = prefix.length + (clearedMatrixPlaceholder ? 1 : innerBeforeMarker.length);
        } else {
          const needLeftSpace = /\\[a-zA-Z]+$/.test(prefix) && /^[a-zA-Z]/.test(newInner);
          const leftPad = needLeftSpace ? ' ' : '';
          const midWithPrefix = prefix + leftPad + newInner;
          const needRightSpace = /\\[a-zA-Z]+$/.test(midWithPrefix) && /^[a-zA-Z]/.test(suffix);
          nextLatex = midWithPrefix + (needRightSpace ? ' ' : '') + suffix;
          caretOffsetInNext = prefix.length + leftPad.length + (clearedMatrixPlaceholder ? 1 : innerBeforeMarker.length);
        }
      } else {
        const prefix = doc.source.slice(0, slot.outerStart);
        const suffix = doc.source.slice(slot.outerEnd);
        const wrapped = '{' + newInner + '}';
        nextLatex = prefix + wrapped + suffix;
        caretOffsetInNext = prefix.length + 1 + innerBeforeMarker.length;
      }

      const nextDoc = parseVisual(nextLatex);
      if (markerIdx >= 0) {
        return { latex: nextLatex, cursor: offsetToVisualCursor(nextDoc, caretOffsetInNext) };
      }
      if (clearedMatrixPlaceholder && nextDoc.slots.has(slot.id)) {
        return { latex: nextLatex, cursor: { slotId: slot.id, index: 0, anchor: null } };
      }
      if (nextDoc.slots.has(slot.id)) {
        const updatedSlot = nextDoc.slots.get(slot.id);
        const targetIndex = Math.max(0, Math.min(updatedSlot.atoms.length, updatedSlot.atoms.length - rightAtomCount));
        return { latex: nextLatex, cursor: { slotId: slot.id, index: targetIndex, anchor: null } };
      }
      return { latex: nextLatex, cursor: offsetToVisualCursor(nextDoc, caretOffsetInNext) };
    }

    function formatPlainInputForVisual(rawTextInput, isTextSlot, fontWrapCmd) {
      if (isTextSlot) {
        return rawTextInput.replace(/([\\{}])/g, '');
      }
      let out = '';
      let proseBuf = '';
      let letterBuf = '';
      const flushLetters = () => {
        if (letterBuf.length > 0) {
          const wrapped = fontWrapCmd ? '\\' + fontWrapCmd + '{' + letterBuf + '}' : letterBuf;
          out = joinLatexParts(out, wrapped, '');
          letterBuf = '';
        }
      };
      const flushProse = () => {
        if (proseBuf.length > 0) {
          out = joinLatexParts(out, '\\text{' + proseBuf + '}', '');
          proseBuf = '';
        }
      };
      for (const ch of Array.from(rawTextInput)) {
        if (ch === '\n' || ch === '\r' || ch === '\t') continue;
        if (ch === ' ') {
          flushLetters();
          if (proseBuf.length > 0) proseBuf += ' ';
          else out = joinLatexParts(out, '\\ ', '');
          continue;
        }
        if (ch === '{' || ch === '}' || ch === '%' || ch === '&' || ch === '#' || ch === '$') {
          flushLetters();
          flushProse();
          out = joinLatexParts(out, '\\' + ch, '');
          continue;
        }
        const cp = ch.codePointAt(0);
        const isCjkOrFullwidth = (cp >= 0x3000 && cp <= 0x9fff) || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xff00 && cp <= 0xffef);
        if (isCjkOrFullwidth) {
          flushLetters();
          proseBuf += ch;
        } else if (fontWrapCmd && /^[a-zA-Z]$/.test(ch)) {
          flushProse();
          letterBuf += ch;
        } else {
          flushLetters();
          flushProse();
          out = joinLatexParts(out, ch, '');
        }
      }
      flushLetters();
      flushProse();
      return out;
    }

    function getEnclosingSlantInfo(doc, slotId) {
      let curSlot = doc.slots.get(slotId);
      const startSlot = curSlot;
      let directFontAtom = null;
      if (startSlot && startSlot.parentAtomId) {
        const p = doc.atoms.get(startSlot.parentAtomId);
        if (p && p.type === 'font' && p.bodySlotId === startSlot.id && (p.cmd === 'mathrm' || p.cmd === 'mathit')) {
          directFontAtom = p;
        }
      }
      while (curSlot && curSlot.parentAtomId) {
        const pAtom = doc.atoms.get(curSlot.parentAtomId);
        if (!pAtom) break;
        if (pAtom.type === 'script' && pAtom.baseAtom && pAtom.baseAtom.type === 'font' && pAtom.baseAtom.bodySlotId === curSlot.id) {
          const bCmd = pAtom.baseAtom.cmd;
          if (bCmd === 'mathrm' || bCmd === 'mathsf' || bCmd === 'mathtt') {
            return { slant: 'upright', directFontAtom: null };
          }
          if (bCmd === 'mathit') {
            return { slant: 'italic', directFontAtom: null };
          }
        }
        if (pAtom.type === 'font') {
          if (pAtom.cmd === 'mathrm' || pAtom.cmd === 'mathsf' || pAtom.cmd === 'mathtt') {
            return { slant: 'upright', directFontAtom };
          }
          if (pAtom.cmd === 'mathit') {
            return { slant: 'italic', directFontAtom };
          }
        }
        if (pAtom.type === 'operatorname' || pAtom.type === 'textstyle') {
          return { slant: 'upright', directFontAtom };
        }
        curSlot = doc.slots.get(pAtom.slotId);
      }
      return { slant: 'italic', directFontAtom };
    }

    function visualInsertText(latex, cursor, rawInput, options) {
      if (!rawInput) return { latex, cursor };
      const doc = parseVisual(latex);
      const norm = normalizeVisualCursor(doc, cursor);
      const slot = doc.slots.get(norm.slotId);
      if (!slot) return { latex, cursor: norm };
      const [s, e] = selectedBounds(norm);

      if (slot.isTextSlot) {
        const formattedText = formatPlainInputForVisual(rawInput, true, null);
        if (formattedText === '') return { latex, cursor: norm };
        return editSlotRange(doc, slot.id, s, e, formattedText);
      }

      const charItalic = options?.charItalic !== false;
      const preserveCurrentFontSlot = Boolean(options?.preserveCurrentFontSlot);
      const hasAsciiLetters = /[a-zA-Z]/.test(rawInput);
      const slantInfo = getEnclosingSlantInfo(doc, slot.id);
      const wantSlant = charItalic ? 'italic' : 'upright';

      // If cursor is directly inside \mathrm{...} or \mathit{...} and user's chosen slant
      // differs from that wrapper (and wasn't just entered via explicit \mathrm command),
      // split the wrapper cleanly so the newly typed letters render in the chosen slant.
      if (!preserveCurrentFontSlot && hasAsciiLetters && slantInfo.directFontAtom && slantInfo.slant !== wantSlant) {
        const fAtom = slantInfo.directFontAtom;
        const pSlot = doc.slots.get(fAtom.slotId);
        if (pSlot) {
          const leftPart = s === 0 ? '' : doc.source.slice(slot.atoms[0].start, slot.atoms[s - 1].end);
          const rightPart = e >= slot.atoms.length ? '' : doc.source.slice(slot.atoms[e].start, slot.atoms[slot.atoms.length - 1].end);
          const pSlantInfo = getEnclosingSlantInfo(doc, pSlot.id);
          const midWrap = pSlantInfo.slant === wantSlant ? null : (wantSlant === 'upright' ? 'mathrm' : 'mathit');
          const midFormatted = formatPlainInputForVisual(rawInput, false, midWrap);
          if (midFormatted === '') return { latex, cursor: norm };
          const leftPiece = leftPart !== '' ? '\\' + fAtom.cmd + '{' + leftPart + '}' : '';
          const rightPiece = rightPart !== '' ? '\\' + fAtom.cmd + '{' + rightPart + '}' : '';
          const combined = joinLatexParts(joinLatexParts(leftPiece, midFormatted + '@', ''), rightPiece, '');
          return editSlotRange(doc, pSlot.id, fAtom.indexInSlot, fAtom.indexInSlot + 1, combined);
        }
      }

      const needWrapCmd = (!preserveCurrentFontSlot && slantInfo.slant !== wantSlant)
        ? (wantSlant === 'upright' ? 'mathrm' : 'mathit')
        : null;
      const formatted = formatPlainInputForVisual(rawInput, false, needWrapCmd);
      if (formatted === '') return { latex, cursor: norm };

      // Coalesce consecutive \mathrm{...} runs when typing upright letters in normal math slots
      if (needWrapCmd === 'mathrm') {
        const prevAtom = s > 0 ? slot.atoms[s - 1] : null;
        const nextAtom = e < slot.atoms.length ? slot.atoms[e] : null;
        const prevIsRm = Boolean(prevAtom && prevAtom.type === 'font' && prevAtom.cmd === 'mathrm');
        const nextIsRm = Boolean(nextAtom && nextAtom.type === 'font' && nextAtom.cmd === 'mathrm');
        const prevSlot = prevIsRm ? doc.slots.get(prevAtom.bodySlotId) : null;
        const nextSlot = nextIsRm ? doc.slots.get(nextAtom.bodySlotId) : null;
        const prevInner = prevSlot ? doc.source.slice(prevSlot.contentStart, prevSlot.contentEnd) : '';
        const nextInner = nextSlot ? doc.source.slice(nextSlot.contentStart, nextSlot.contentEnd) : '';

        const singleRm = /^\\mathrm\{([a-zA-Z]+)\}$/.exec(formatted);
        if (singleRm) {
          if (prevIsRm && nextIsRm) {
            const leftMerged = joinLatexParts(prevInner, singleRm[1], '');
            const pad = /\\[a-zA-Z]+$/.test(leftMerged) && /^[a-zA-Z]/.test(nextInner) ? ' ' : '';
            return editSlotRange(doc, slot.id, s - 1, e + 1, '\\mathrm{' + leftMerged + '@' + pad + nextInner + '}');
          }
          if (prevIsRm) {
            return editSlotRange(doc, slot.id, s - 1, e, '\\mathrm{' + joinLatexParts(prevInner, singleRm[1], '') + '}');
          }
          if (nextIsRm) {
            return editSlotRange(doc, slot.id, s, e + 1, '\\mathrm{' + singleRm[1] + '@' + nextInner + '}');
          }
        } else {
          const leadRm = /^\\mathrm\{([a-zA-Z]+)\}([\s\S]+)$/.exec(formatted);
          if (leadRm && prevIsRm) {
            const mergedHead = '\\mathrm{' + joinLatexParts(prevInner, leadRm[1], '') + '}';
            return editSlotRange(doc, slot.id, s - 1, e, joinLatexParts(mergedHead, leadRm[2], ''));
          }
        }
      }

      return editSlotRange(doc, slot.id, s, e, formatted);
    }

    function applySymbolSlantForVisual(item, charItalic, isTextSlot) {
      if (charItalic || isTextSlot || !item || item.kind !== 'symbol' || typeof item.latex !== 'string') {
        return item;
      }
      const m = /^\\([a-zA-Z]+)$/.exec(item.latex.trim());
      if (!m) return item;
      const cmd = m[1];
      if (VAR_GREEK_TO_UPRIGHT[cmd] !== undefined) {
        return { ...item, latex: VAR_GREEK_TO_UPRIGHT[cmd] };
      }
      if (LOWER_GREEK_CMD_TO_GLYPH[cmd] !== undefined) {
        return { ...item, latex: '\\text{' + LOWER_GREEK_CMD_TO_GLYPH[cmd] + '}' };
      }
      return item;
    }

    function visualInsertItem(latex, cursor, item, options) {
      const doc = parseVisual(latex);
      const norm = normalizeVisualCursor(doc, cursor);
      const slot = doc.slots.get(norm.slotId);
      if (!slot) return { latex, cursor: norm };
      const charItalic = options?.charItalic !== false;
      const effectiveItem = applySymbolSlantForVisual(item, charItalic, slot.isTextSlot);
      const [s, e] = selectedBounds(norm);
      const selected = s < e ? doc.source.slice(slot.atoms[s].start, slot.atoms[e - 1].end) : '';
      const compatible = compatibleLatex(effectiveItem.latex);
      const marker = compatible.indexOf('@');

      // Smart attachment when inserting ^{@}, _{@}, or _{@}^{} with no selection after a base atom
      if (s === e && (compatible === '^{@}' || compatible === '_{@}' || compatible === '_{@}^{}')) {
        if (s === 0) {
          return editSlotRange(doc, slot.id, s, e, '{}' + compatible);
        }
        const prev = slot.atoms[s - 1];
        const needsBrace = prev && ['frac', 'sqrt', 'binom', 'stack', 'line', 'longdiv', 'accent', 'decoration', 'xarrow', 'matrix'].includes(prev.type);
        if (needsBrace) {
          const prevLatex = doc.source.slice(prev.start, prev.end);
          return editSlotRange(doc, slot.id, s - 1, s, '{' + prevLatex + '}' + compatible);
        }
      }

      let snippet;
      if (marker >= 0) {
        if (selected.length > 0) {
          // Place caret right after wrapped selection if there is no second empty slot, or at next empty slot if present
          snippet = compatible.slice(0, marker) + selected + '@' + compatible.slice(marker + 1).replace(/@/g, '');
        } else {
          snippet = compatible.slice(0, marker + 1) + compatible.slice(marker + 1).replace(/@/g, '');
        }
      } else {
        snippet = compatible;
      }
      return editSlotRange(doc, slot.id, s, e, snippet);
    }

    function convertAtomListToSlant(doc, atoms, targetItalic) {
      let out = '';
      let letterBuf = '';
      const flushLetters = () => {
        if (letterBuf !== '') {
          out = joinLatexParts(out, '\\mathrm{' + letterBuf + '}', '');
          letterBuf = '';
        }
      };

      for (const atom of atoms) {
        if (!targetItalic && atom.type === 'text' && !atom.unknown && /^[a-zA-Z]+$/.test(atom.v)) {
          letterBuf += atom.v;
          continue;
        }
        if (atom.type === 'font' && (atom.cmd === 'mathrm' || atom.cmd === 'mathit')) {
          const fSlot = doc.slots.get(atom.bodySlotId);
          if (!fSlot || fSlot.atoms.length === 0) continue;
          if (!targetItalic && fSlot.atoms.every((a) => a.type === 'text' && !a.unknown && /^[a-zA-Z]+$/.test(a.v))) {
            letterBuf += fSlot.atoms.map((a) => a.v).join('');
            continue;
          }
          flushLetters();
          const inner = convertAtomListToSlant(doc, fSlot.atoms, targetItalic);
          out = joinLatexParts(out, inner, '');
          continue;
        }
        flushLetters();

        if (atom.type === 'group') {
          const gSlot = doc.slots.get(atom.bodySlotId);
          const inner = gSlot ? convertAtomListToSlant(doc, gSlot.atoms, targetItalic) : '';
          out = joinLatexParts(out, '{' + inner + '}', '');
          continue;
        }
        if (atom.type === 'sym') {
          const rawSym = doc.source.slice(atom.start, atom.end).trim();
          const cmdMatch = /^\\([a-zA-Z]+)$/.exec(rawSym);
          const txtMatch = /^\\text\{([^}]*)\}$/.exec(rawSym);
          if (!targetItalic) {
            if (cmdMatch && VAR_GREEK_TO_UPRIGHT[cmdMatch[1]] !== undefined) {
              out = joinLatexParts(out, VAR_GREEK_TO_UPRIGHT[cmdMatch[1]], '');
              continue;
            }
            if (cmdMatch && LOWER_GREEK_CMD_TO_GLYPH[cmdMatch[1]] !== undefined) {
              out = joinLatexParts(out, '\\text{' + LOWER_GREEK_CMD_TO_GLYPH[cmdMatch[1]] + '}', '');
              continue;
            }
          } else {
            if (txtMatch && LOWER_GREEK_GLYPH_TO_CMD[txtMatch[1]] !== undefined) {
              out = joinLatexParts(out, '\\' + LOWER_GREEK_GLYPH_TO_CMD[txtMatch[1]], '');
              continue;
            }
            if (cmdMatch && UPRIGHT_GREEK_TO_VAR[cmdMatch[1]] !== undefined) {
              out = joinLatexParts(out, UPRIGHT_GREEK_TO_VAR[cmdMatch[1]], '');
              continue;
            }
          }
          out = joinLatexParts(out, rawSym, '');
          continue;
        }
        if (atom.childSlots.length > 0 && !['textstyle', 'operatorname', 'hspace', 'font'].includes(atom.type)) {
          const patches = [];
          const baseChildIds = new Set();
          if (atom.type === 'script' && atom.baseAtom && !atom.baseSlotId) {
            for (const cid of atom.baseAtom.childSlots) baseChildIds.add(cid);
            let convertedBase = convertAtomListToSlant(doc, [atom.baseAtom], targetItalic);
            if (convertedBase !== '') {
              const baseProbe = parseVisual(convertedBase).slots.get('root');
              if (baseProbe && baseProbe.atoms.length > 1) {
                convertedBase = '{' + convertedBase + '}';
              }
            } else {
              convertedBase = '{}';
            }
            patches.push({ start: atom.baseAtom.start, end: atom.baseAtom.end, text: convertedBase });
          }
          for (const cid of atom.childSlots) {
            if (baseChildIds.has(cid)) continue;
            const cSlot = doc.slots.get(cid);
            if (!cSlot || cSlot.readOnly || cSlot.isTextSlot) continue;
            let newInner = convertAtomListToSlant(doc, cSlot.atoms, targetItalic);
            if (cSlot.isMatrixCell && newInner.trim() === '') newInner = '{}';
            if (cSlot.braced) {
              patches.push({ start: cSlot.contentStart, end: cSlot.contentEnd, text: newInner });
            } else {
              patches.push({ start: cSlot.outerStart, end: cSlot.outerEnd, text: '{' + newInner + '}' });
            }
          }
          patches.sort((a, b) => b.start - a.start);
          let rawAtom = doc.source.slice(atom.start, atom.end);
          for (const patch of patches) {
            const relStart = patch.start - atom.start;
            const relEnd = patch.end - atom.start;
            const before = rawAtom.slice(0, relStart);
            const after = rawAtom.slice(relEnd);
            const needL = /\\[a-zA-Z]+$/.test(before) && /^[a-zA-Z]/.test(patch.text) ? ' ' : '';
            const midStr = before + needL + patch.text;
            const needR = /\\[a-zA-Z]+$/.test(midStr) && /^[a-zA-Z]/.test(after) ? ' ' : '';
            rawAtom = midStr + needR + after;
          }
          out = joinLatexParts(out, rawAtom, '');
          continue;
        }
        out = joinLatexParts(out, doc.source.slice(atom.start, atom.end), '');
      }
      flushLetters();
      return out;
    }

    function visualApplySlant(latex, cursor, targetItalic) {
      const doc = parseVisual(latex);
      const norm = normalizeVisualCursor(doc, cursor);
      const slot = doc.slots.get(norm.slotId);
      if (!slot || slot.isTextSlot) return { latex, cursor: norm };

      const [s, e] = selectedBounds(norm);
      const slantInfo = getEnclosingSlantInfo(doc, slot.id);

      // Caret only (no selection): if switching back to italic while sitting at boundary of \mathrm{...}, step cleanly outside
      if (s === e) {
        if (targetItalic && slantInfo.directFontAtom && slantInfo.directFontAtom.cmd === 'mathrm') {
          const fAtom = slantInfo.directFontAtom;
          const pSlot = doc.slots.get(fAtom.slotId);
          if (pSlot) {
            if (slot.atoms.length === 0) {
              return editSlotRange(doc, pSlot.id, fAtom.indexInSlot, fAtom.indexInSlot + 1, '');
            }
            if (s === slot.atoms.length) {
              return { latex, cursor: { slotId: pSlot.id, index: fAtom.indexInSlot + 1, anchor: null } };
            }
            if (s === 0) {
              return { latex, cursor: { slotId: pSlot.id, index: fAtom.indexInSlot, anchor: null } };
            }
          }
        }
        return { latex, cursor: norm };
      }

      // Active selection inside \mathrm{...} while switching to italic -> split \mathrm{...} and select the italic slice
      if (targetItalic && slantInfo.directFontAtom && slantInfo.directFontAtom.cmd === 'mathrm') {
        const fAtom = slantInfo.directFontAtom;
        const pSlot = doc.slots.get(fAtom.slotId);
        if (pSlot) {
          const leftPart = s === 0 ? '' : doc.source.slice(slot.atoms[0].start, slot.atoms[s - 1].end);
          const rightPart = e >= slot.atoms.length ? '' : doc.source.slice(slot.atoms[e].start, slot.atoms[slot.atoms.length - 1].end);
          const midConverted = convertAtomListToSlant(doc, slot.atoms.slice(s, e), true);
          const leftPiece = leftPart !== '' ? '\\mathrm{' + leftPart + '}' : '';
          const rightPiece = rightPart !== '' ? '\\mathrm{' + rightPart + '}' : '';
          const combined = joinLatexParts(joinLatexParts(leftPiece, midConverted, ''), rightPiece, '');
          const rightAtomsInParent = (pSlot.atoms.length - (fAtom.indexInSlot + 1)) + (rightPiece !== '' ? 1 : 0);
          const selStart = fAtom.indexInSlot + (leftPiece !== '' ? 1 : 0);
          const edited = editSlotRange(doc, pSlot.id, fAtom.indexInSlot, fAtom.indexInSlot + 1, combined);
          const nextDoc = parseVisual(edited.latex);
          const updatedParent = nextDoc.slots.get(pSlot.id);
          if (updatedParent) {
            const selEnd = Math.max(selStart, updatedParent.atoms.length - rightAtomsInParent);
            return {
              latex: edited.latex,
              cursor: { slotId: pSlot.id, index: selEnd, anchor: selEnd === selStart ? null : selStart },
            };
          }
          return edited;
        }
      }

      // Already inside \mathrm{...} and requesting upright -> convert any slanted Greek symbols inside selection
      if (!targetItalic && slantInfo.slant === 'upright') {
        const innerConverted = convertAtomListToSlant(doc, slot.atoms.slice(s, e), false)
          .replace(/\\mathrm\{([a-zA-Z]+)\}/g, '$1');
        const rightCount = slot.atoms.length - e;
        const edited = editSlotRange(doc, slot.id, s, e, innerConverted);
        const nextDoc = parseVisual(edited.latex);
        const updatedSlot = nextDoc.slots.get(slot.id);
        if (updatedSlot) {
          const selEnd = Math.max(s, updatedSlot.atoms.length - rightCount);
          return {
            latex: edited.latex,
            cursor: { slotId: slot.id, index: selEnd, anchor: selEnd === s ? null : s },
          };
        }
        return edited;
      }

      const converted = convertAtomListToSlant(doc, slot.atoms.slice(s, e), targetItalic);

      // When converting to upright in normal math slot, merge cleanly with any adjacent \mathrm{...} neighbors
      if (!targetItalic) {
        const singleRm = /^\\mathrm\{([a-zA-Z]+)\}$/.exec(converted);
        if (singleRm) {
          const prevAtom = s > 0 ? slot.atoms[s - 1] : null;
          const nextAtom = e < slot.atoms.length ? slot.atoms[e] : null;
          const prevIsRm = Boolean(prevAtom && prevAtom.type === 'font' && prevAtom.cmd === 'mathrm');
          const nextIsRm = Boolean(nextAtom && nextAtom.type === 'font' && nextAtom.cmd === 'mathrm');
          if (prevIsRm || nextIsRm) {
            const prevSlot = prevIsRm ? doc.slots.get(prevAtom.bodySlotId) : null;
            const nextSlot = nextIsRm ? doc.slots.get(nextAtom.bodySlotId) : null;
            const prevInner = prevSlot ? doc.source.slice(prevSlot.contentStart, prevSlot.contentEnd) : '';
            const nextInner = nextSlot ? doc.source.slice(nextSlot.contentStart, nextSlot.contentEnd) : '';
            const prevAtomCount = prevSlot ? prevSlot.atoms.length : 0;
            const nextAtomCount = nextSlot ? nextSlot.atoms.length : 0;
            const repStart = prevIsRm ? s - 1 : s;
            const repEnd = nextIsRm ? e + 1 : e;
            const mergedInner = joinLatexParts(joinLatexParts(prevInner, singleRm[1], ''), nextInner, '');
            const edited = editSlotRange(doc, slot.id, repStart, repEnd, '\\mathrm{' + mergedInner + '}');
            const nextDoc = parseVisual(edited.latex);
            const updatedSlot = nextDoc.slots.get(slot.id);
            const mergedAtom = updatedSlot?.atoms[repStart];
            const mergedFontSlot = mergedAtom?.bodySlotId ? nextDoc.slots.get(mergedAtom.bodySlotId) : null;
            if (mergedFontSlot) {
              const innerStart = prevAtomCount;
              const innerEnd = Math.max(innerStart, mergedFontSlot.atoms.length - nextAtomCount);
              return {
                latex: edited.latex,
                cursor: { slotId: mergedFontSlot.id, index: innerEnd, anchor: innerEnd === innerStart ? null : innerStart },
              };
            }
            return edited;
          }
        }
      }

      const rightCount = slot.atoms.length - e;
      const edited = editSlotRange(doc, slot.id, s, e, converted);
      const nextDoc = parseVisual(edited.latex);
      const updatedSlot = nextDoc.slots.get(slot.id);
      if (updatedSlot) {
        const selEnd = Math.max(s, updatedSlot.atoms.length - rightCount);
        return {
          latex: edited.latex,
          cursor: { slotId: slot.id, index: selEnd, anchor: selEnd === s ? null : s },
        };
      }
      return edited;
    }

    function visualApplyScriptKey(latex, cursor, kind) {
      const doc = parseVisual(latex);
      const norm = normalizeVisualCursor(doc, cursor);
      const slot = doc.slots.get(norm.slotId);
      if (!slot) return { latex, cursor: norm };
      if (slot.isTextSlot) return visualInsertText(latex, cursor, kind);

      const [s, e] = selectedBounds(norm);
      if (s < e) {
        const selected = doc.source.slice(slot.atoms[s].start, slot.atoms[e - 1].end);
        return editSlotRange(doc, slot.id, s, e, '{' + selected + '}' + kind + '{@}');
      }

      // Typing ^ at the end of a subscript (e.g. x_i^2 or \int_0^1) or _ at the end of a superscript
      // attaches/jumps to the sibling script on the same base!
      if (s === slot.atoms.length && slot.atoms.length > 0 && slot.parentAtomId &&
          ((kind === '^' && slot.role === 'sub') || (kind === '_' && slot.role === 'sup'))) {
        const pAtom = doc.atoms.get(slot.parentAtomId);
        if (pAtom && ['script', 'integral', 'bigop', 'mathop'].includes(pAtom.type)) {
          const siblingId = kind === '^' ? pAtom.supSlotId : pAtom.subSlotId;
          if (siblingId && doc.slots.has(siblingId)) {
            const sib = doc.slots.get(siblingId);
            return { latex, cursor: { slotId: sib.id, index: sib.atoms.length, anchor: null } };
          }
          const nextLatex = doc.source.slice(0, pAtom.end) + kind + '{}' + doc.source.slice(pAtom.end);
          const nextDoc = parseVisual(nextLatex);
          return { latex: nextLatex, cursor: offsetToVisualCursor(nextDoc, pAtom.end + 2) };
        }
      }

      const prev = s > 0 ? slot.atoms[s - 1] : null;
      if (!prev) {
        return editSlotRange(doc, slot.id, s, s, '{}' + kind + '{@}');
      }

      // If previous atom already has that script slot, jump directly into it!
      if (kind === '^' && prev.supSlotId && doc.slots.has(prev.supSlotId)) {
        const existing = doc.slots.get(prev.supSlotId);
        return { latex, cursor: { slotId: existing.id, index: existing.atoms.length, anchor: null } };
      }
      if (kind === '_' && prev.subSlotId && doc.slots.has(prev.subSlotId)) {
        const existing = doc.slots.get(prev.subSlotId);
        return { latex, cursor: { slotId: existing.id, index: existing.atoms.length, anchor: null } };
      }

      const needsBrace = ['frac', 'sqrt', 'binom', 'stack', 'line', 'longdiv', 'accent', 'decoration', 'xarrow', 'matrix'].includes(prev.type) &&
        !(prev.type === 'accent' && (prev.mark === '⎴' || prev.mark === '⎵'));
      if (needsBrace) {
        const prevLatex = doc.source.slice(prev.start, prev.end);
        return editSlotRange(doc, slot.id, s - 1, s, '{' + prevLatex + '}' + kind + '{@}');
      }

      // Insert ^{} or _{} right at prev.end
      const nextLatex = doc.source.slice(0, prev.end) + kind + '{}' + doc.source.slice(prev.end);
      const nextDoc = parseVisual(nextLatex);
      return { latex: nextLatex, cursor: offsetToVisualCursor(nextDoc, prev.end + 2) };
    }

    function allChildSlotsEmpty(doc, atom) {
      for (const cid of atom.childSlots) {
        const cSlot = doc.slots.get(cid);
        if (cSlot && cSlot.atoms.length > 0) return false;
      }
      return true;
    }

    function visualDeleteBackward(latex, cursor) {
      const doc = parseVisual(latex);
      const norm = normalizeVisualCursor(doc, cursor);
      const slot = doc.slots.get(norm.slotId);
      if (!slot) return { latex, cursor: norm };

      const [s, e] = selectedBounds(norm);
      const inlineFontParent = slot.parentAtomId ? doc.atoms.get(slot.parentAtomId) : null;
      const isDirectInlineFontBody = Boolean(
        inlineFontParent && inlineFontParent.type === 'font' &&
        (inlineFontParent.cmd === 'mathrm' || inlineFontParent.cmd === 'mathit') &&
        inlineFontParent.bodySlotId === slot.id
      );

      if (s < e) {
        if (isDirectInlineFontBody && s === 0 && e === slot.atoms.length) {
          const pSlot = doc.slots.get(inlineFontParent.slotId);
          if (pSlot) {
            return editSlotRange(doc, pSlot.id, inlineFontParent.indexInSlot, inlineFontParent.indexInSlot + 1, '');
          }
        }
        return editSlotRange(doc, slot.id, s, e, '');
      }

      if (s > 0) {
        const prev = slot.atoms[s - 1];
        if (prev.childSlots.length === 0 || allChildSlotsEmpty(doc, prev)) {
          if (isDirectInlineFontBody && slot.atoms.length === 1) {
            const pSlot = doc.slots.get(inlineFontParent.slotId);
            if (pSlot) {
              return editSlotRange(doc, pSlot.id, inlineFontParent.indexInSlot, inlineFontParent.indexInSlot + 1, '');
            }
          }
          return editSlotRange(doc, slot.id, s - 1, s, '');
        }
        // Inline upright/italic font run (\mathrm{...} / \mathit{...}): pop its last simple character directly
        if (prev.type === 'font' && (prev.cmd === 'mathrm' || prev.cmd === 'mathit')) {
          const fSlot = doc.slots.get(prev.bodySlotId);
          if (fSlot && fSlot.atoms.length > 0) {
            const lastInFont = fSlot.atoms[fSlot.atoms.length - 1];
            if (lastInFont.childSlots.length === 0 || allChildSlotsEmpty(doc, lastInFont)) {
              if (fSlot.atoms.length === 1) {
                return editSlotRange(doc, slot.id, s - 1, s, '');
              }
              const keptInner = doc.source.slice(fSlot.atoms[0].start, fSlot.atoms[fSlot.atoms.length - 2].end);
              return editSlotRange(doc, slot.id, s - 1, s, '\\' + prev.cmd + '{' + keptInner + '}');
            }
          }
        }
        // Enter the last editable child slot of `prev` at its end (safe structural Backspace)
        const lastChildId = prev.childSlots[prev.childSlots.length - 1];
        const lastChild = doc.slots.get(lastChildId);
        if (lastChild) {
          return { latex, cursor: { slotId: lastChild.id, index: lastChild.atoms.length, anchor: null } };
        }
        return editSlotRange(doc, slot.id, s - 1, s, '');
      }

      // s === 0: at the very beginning of `slot`
      if (slot.id === 'root' || !slot.parentAtomId) {
        return { latex, cursor: norm };
      }
      const parentAtom = doc.atoms.get(slot.parentAtomId);
      if (!parentAtom) return { latex, cursor: norm };
      const parentSlot = doc.slots.get(parentAtom.slotId);

      // Removing an empty ^ or _ script slot restores the base cleanly
      if ((slot.role === 'sup' || slot.role === 'sub') && slot.atoms.length === 0 && slot.opStart !== null) {
        const nextLatex = joinLatexParts(doc.source.slice(0, slot.opStart), '', doc.source.slice(slot.outerEnd));
        const nextDoc = parseVisual(nextLatex);
        return { latex: nextLatex, cursor: offsetToVisualCursor(nextDoc, slot.opStart) };
      }

      // Unwrap single-body wrappers (\sqrt{x}, \overline{x}, \widehat{x}, \boxed{x}, {x}, \text{x}) when Backspace pressed at start of body
      if (['sqrt', 'line', 'longdiv', 'accent', 'brace', 'decoration', 'not', 'phantom', 'font', 'textstyle', 'group', 'delim'].includes(parentAtom.type) &&
          parentSlot && (!parentAtom.midSlotId)) {
        const bodyKeep = slot.id === parentAtom.bodySlotId
          ? doc.source.slice(slot.contentStart, slot.contentEnd)
          : '';
        return editSlotRange(doc, parentSlot.id, parentAtom.indexInSlot, parentAtom.indexInSlot + 1, '@' + bodyKeep);
      }

      // Fraction: if whole fraction is empty, delete it; if denominator is empty and caret at start of denominator, unwrap numerator
      if ((parentAtom.type === 'frac' || parentAtom.type === 'binom') && parentSlot) {
        if (allChildSlotsEmpty(doc, parentAtom)) {
          return editSlotRange(doc, parentSlot.id, parentAtom.indexInSlot, parentAtom.indexInSlot + 1, '');
        }
        const secondId = parentAtom.denSlotId || parentAtom.bottomSlotId;
        const firstId = parentAtom.numSlotId || parentAtom.topSlotId;
        if (slot.id === secondId && slot.atoms.length === 0 && firstId) {
          const firstSlot = doc.slots.get(firstId);
          const numKeep = firstSlot ? doc.source.slice(firstSlot.contentStart, firstSlot.contentEnd) : '';
          return editSlotRange(doc, parentSlot.id, parentAtom.indexInSlot, parentAtom.indexInSlot + 1, numKeep + '@');
        }
      }

      // Default: step left out of current slot
      return { latex, cursor: visualMoveHorizontal(doc, norm, -1, false) };
    }

    function visualDeleteForward(latex, cursor) {
      const doc = parseVisual(latex);
      const norm = normalizeVisualCursor(doc, cursor);
      const slot = doc.slots.get(norm.slotId);
      if (!slot) return { latex, cursor: norm };

      const [s, e] = selectedBounds(norm);
      const inlineFontParent = slot.parentAtomId ? doc.atoms.get(slot.parentAtomId) : null;
      const isDirectInlineFontBody = Boolean(
        inlineFontParent && inlineFontParent.type === 'font' &&
        (inlineFontParent.cmd === 'mathrm' || inlineFontParent.cmd === 'mathit') &&
        inlineFontParent.bodySlotId === slot.id
      );

      if (s < e) {
        if (isDirectInlineFontBody && s === 0 && e === slot.atoms.length) {
          const pSlot = doc.slots.get(inlineFontParent.slotId);
          if (pSlot) {
            return editSlotRange(doc, pSlot.id, inlineFontParent.indexInSlot, inlineFontParent.indexInSlot + 1, '');
          }
        }
        return editSlotRange(doc, slot.id, s, e, '');
      }
      if (s < slot.atoms.length) {
        const nextAtom = slot.atoms[s];
        if (nextAtom.childSlots.length === 0 || allChildSlotsEmpty(doc, nextAtom)) {
          if (isDirectInlineFontBody && slot.atoms.length === 1) {
            const pSlot = doc.slots.get(inlineFontParent.slotId);
            if (pSlot) {
              return editSlotRange(doc, pSlot.id, inlineFontParent.indexInSlot, inlineFontParent.indexInSlot + 1, '');
            }
          }
          return editSlotRange(doc, slot.id, s, s + 1, '');
        }
        if (nextAtom.type === 'font' && (nextAtom.cmd === 'mathrm' || nextAtom.cmd === 'mathit')) {
          const fSlot = doc.slots.get(nextAtom.bodySlotId);
          if (fSlot && fSlot.atoms.length > 0) {
            const firstInFont = fSlot.atoms[0];
            if (firstInFont.childSlots.length === 0 || allChildSlotsEmpty(doc, firstInFont)) {
              if (fSlot.atoms.length === 1) {
                return editSlotRange(doc, slot.id, s, s + 1, '');
              }
              const keptInner = doc.source.slice(fSlot.atoms[1].start, fSlot.atoms[fSlot.atoms.length - 1].end);
              const edited = editSlotRange(doc, slot.id, s, s + 1, '\\' + nextAtom.cmd + '{' + keptInner + '}');
              return { latex: edited.latex, cursor: { slotId: slot.id, index: s, anchor: null } };
            }
          }
        }
        const firstChild = doc.slots.get(nextAtom.childSlots[0]);
        if (firstChild) {
          return { latex, cursor: { slotId: firstChild.id, index: 0, anchor: null } };
        }
      }
      return { latex, cursor: norm };
    }

    function visualMoveHorizontal(doc, cursor, dir, extendSelection) {
      const norm = normalizeVisualCursor(doc, cursor);
      const slot = doc.slots.get(norm.slotId);
      if (!slot) return norm;

      if (extendSelection) {
        const nextIdx = norm.index + dir;
        if (nextIdx >= 0 && nextIdx <= slot.atoms.length) {
          const anchor = norm.anchor !== null ? norm.anchor : norm.index;
          return { slotId: slot.id, index: nextIdx, anchor: anchor === nextIdx ? null : anchor };
        }
        // Extending past slot boundary selects the parent compound atom in its parent slot
        if (slot.parentAtomId) {
          const pAtom = doc.atoms.get(slot.parentAtomId);
          if (pAtom) {
            return {
              slotId: pAtom.slotId,
              index: dir < 0 ? pAtom.indexInSlot : pAtom.indexInSlot + 1,
              anchor: dir < 0 ? pAtom.indexInSlot + 1 : pAtom.indexInSlot,
            };
          }
        }
        return norm;
      }

      if (norm.anchor !== null) {
        const [s, e] = selectedBounds(norm);
        return { slotId: slot.id, index: dir < 0 ? s : e, anchor: null };
      }

      const stopIdx = doc.stops.findIndex((st) => st.slotId === norm.slotId && st.index === norm.index);
      if (stopIdx >= 0) {
        const target = doc.stops[stopIdx + dir];
        if (target) return { slotId: target.slotId, index: target.index, anchor: null };
        return norm;
      }

      // If cursor was at a group boundary not directly in `stops`, step within or out of slot
      const candidate = norm.index + dir;
      if (candidate >= 0 && candidate <= slot.atoms.length) {
        return { slotId: slot.id, index: candidate, anchor: null };
      }
      if (slot.parentAtomId) {
        const pAtom = doc.atoms.get(slot.parentAtomId);
        if (pAtom) {
          return { slotId: pAtom.slotId, index: dir < 0 ? pAtom.indexInSlot : pAtom.indexInSlot + 1, anchor: null };
        }
      }
      return norm;
    }

    function visualMoveVertical(doc, cursor, dir) {
      // dir = -1 (Up), +1 (Down)
      const norm = normalizeVisualCursor(doc, cursor);
      let curSlot = doc.slots.get(norm.slotId);
      if (!curSlot) return norm;

      // Walk up ancestor chain to find a 2D structure (frac, binom, script, integral, bigop, stack, xarrow, matrix)
      let probeSlot = curSlot;
      while (probeSlot) {
        if (probeSlot.isMatrixCell && probeSlot.parentAtomId) {
          const mat = doc.atoms.get(probeSlot.parentAtomId);
          if (mat && mat.type === 'matrix') {
            const nextRow = probeSlot.row + dir;
            if (nextRow >= 0 && nextRow < mat.rowSlotIds.length) {
              const rowIds = mat.rowSlotIds[nextRow];
              const targetCol = Math.min(probeSlot.col, rowIds.length - 1);
              const targetSlot = doc.slots.get(rowIds[targetCol]);
              if (targetSlot) {
                return { slotId: targetSlot.id, index: Math.min(norm.index, targetSlot.atoms.length), anchor: null };
              }
            }
          }
        }
        if (probeSlot.parentAtomId) {
          const pAtom = doc.atoms.get(probeSlot.parentAtomId);
          if (pAtom) {
            let targetSlotId = null;
            if (pAtom.type === 'frac') {
              if (dir < 0 && probeSlot.id === pAtom.denSlotId) targetSlotId = pAtom.numSlotId;
              else if (dir > 0 && probeSlot.id === pAtom.numSlotId) targetSlotId = pAtom.denSlotId;
            } else if (pAtom.type === 'binom') {
              if (dir < 0 && probeSlot.id === pAtom.bottomSlotId) targetSlotId = pAtom.topSlotId;
              else if (dir > 0 && probeSlot.id === pAtom.topSlotId) targetSlotId = pAtom.bottomSlotId;
            } else if (pAtom.type === 'script' || pAtom.type === 'integral' || pAtom.type === 'bigop' || pAtom.type === 'mathop') {
              if (dir < 0) {
                if (probeSlot.id === pAtom.subSlotId) targetSlotId = pAtom.baseSlotId || pAtom.bodySlotId || pAtom.supSlotId;
                else if (probeSlot.id !== pAtom.supSlotId) targetSlotId = pAtom.supSlotId;
              } else {
                if (probeSlot.id === pAtom.supSlotId) targetSlotId = pAtom.baseSlotId || pAtom.bodySlotId || pAtom.subSlotId;
                else if (probeSlot.id !== pAtom.subSlotId) targetSlotId = pAtom.subSlotId;
              }
            } else if (pAtom.type === 'stack') {
              const upperId = pAtom.position === 'over' ? pAtom.topSlotId : pAtom.baseSlotId;
              const lowerId = pAtom.position === 'over' ? pAtom.baseSlotId : pAtom.topSlotId;
              if (dir < 0 && probeSlot.id === lowerId) targetSlotId = upperId;
              else if (dir > 0 && probeSlot.id === upperId) targetSlotId = lowerId;
            } else if (pAtom.type === 'xarrow') {
              if (dir < 0 && probeSlot.id === pAtom.belowSlotId) targetSlotId = pAtom.aboveSlotId;
              else if (dir > 0 && probeSlot.id === pAtom.aboveSlotId && pAtom.belowSlotId) targetSlotId = pAtom.belowSlotId;
            }
            if (targetSlotId && doc.slots.has(targetSlotId) && !doc.slots.get(targetSlotId).readOnly) {
              const tSlot = doc.slots.get(targetSlotId);
              return { slotId: tSlot.id, index: Math.min(norm.index, tSlot.atoms.length), anchor: null };
            }
          }
        }
        probeSlot = probeSlot.parentAtomId ? doc.slots.get(doc.atoms.get(probeSlot.parentAtomId)?.slotId) : null;
      }

      // Also allow Up/Down from adjacent atom on baseline to enter its upper/lower slot
      const neighbor = (norm.index > 0 ? curSlot.atoms[norm.index - 1] : null) || curSlot.atoms[norm.index];
      if (neighbor) {
        const candidateId = dir < 0
          ? (neighbor.supSlotId || neighbor.numSlotId || neighbor.topSlotId || neighbor.aboveSlotId)
          : (neighbor.subSlotId || neighbor.denSlotId || neighbor.bottomSlotId || neighbor.belowSlotId);
        if (candidateId && doc.slots.has(candidateId) && !doc.slots.get(candidateId).readOnly) {
          const cSlot = doc.slots.get(candidateId);
          return { slotId: cSlot.id, index: cSlot.atoms.length, anchor: null };
        }
      }
      return norm;
    }

    function visualMoveTab(doc, cursor, reverse) {
      const norm = normalizeVisualCursor(doc, cursor);
      const tabbable = doc.slotOrder
        .filter((id) => id !== 'root')
        .map((id) => doc.slots.get(id))
        .filter((s) => s && !s.readOnly && !s.skipTab);

      if (tabbable.length === 0) {
        const root = doc.slots.get('root');
        return { slotId: 'root', index: reverse ? 0 : (root ? root.atoms.length : 0), anchor: null };
      }

      const emptySlots = tabbable.filter((s) => s.atoms.length === 0);
      const curIdxInTabbable = tabbable.findIndex((s) => s.id === norm.slotId);

      // Prefer jumping across remaining empty placeholder boxes first (AxMath behavior)
      if (emptySlots.length > 0) {
        if (curIdxInTabbable >= 0) {
          const ordered = reverse ? [...tabbable].reverse() : tabbable;
          const pos = ordered.findIndex((s) => s.id === norm.slotId);
          for (let offset = 1; offset <= ordered.length; offset += 1) {
            const cand = ordered[(pos + offset) % ordered.length];
            if (cand.atoms.length === 0 && cand.id !== norm.slotId) {
              return { slotId: cand.id, index: 0, anchor: null };
            }
          }
        } else {
          const firstEmpty = reverse ? emptySlots[emptySlots.length - 1] : emptySlots[0];
          return { slotId: firstEmpty.id, index: 0, anchor: null };
        }
      }

      // Otherwise cycle cleanly through structural slots, exiting to root end after the last slot
      if (curIdxInTabbable >= 0) {
        const nextPos = curIdxInTabbable + (reverse ? -1 : 1);
        if (nextPos >= 0 && nextPos < tabbable.length) {
          const target = tabbable[nextPos];
          return { slotId: target.id, index: target.atoms.length, anchor: null };
        }
        const root = doc.slots.get('root');
        return { slotId: 'root', index: reverse ? 0 : (root ? root.atoms.length : 0), anchor: null };
      }

      const target = reverse ? tabbable[tabbable.length - 1] : tabbable[0];
      return { slotId: target.id, index: target.atoms.length, anchor: null };
    }

    /* ---------------------- Inline \command Catalog ----------------------- */

    const COMMAND_TEMPLATES = {
      frac: '\\frac{@}{}',
      dfrac: '\\dfrac{@}{}',
      tfrac: '\\tfrac{@}{}',
      binom: '\\binom{@}{}',
      sqrt: '\\sqrt{@}',
      nthroot: '\\sqrt[@]{}',
      text: '\\text{@}',
      textbf: '\\textbf{@}',
      mathrm: '\\mathrm{@}',
      mathbf: '\\mathbf{@}',
      mathit: '\\mathit{@}',
      mathsf: '\\mathsf{@}',
      mathtt: '\\mathtt{@}',
      operatorname: '\\operatorname{@}',
      mathbb: '\\mathbb{@}',
      mathcal: '\\mathcal{@}',
      mathscr: '\\mathscr{@}',
      mathfrak: '\\mathfrak{@}',
      boldsymbol: '\\boldsymbol{@}',
      overline: '\\overline{@}',
      underline: '\\underline{@}',
      overbrace: '\\overbrace{@}^{}',
      underbrace: '\\underbrace{@}_{}',
      overbracket: '\\overbracket{@}',
      underbracket: '\\underbracket{@}',
      hat: '\\hat{@}',
      widehat: '\\widehat{@}',
      tilde: '\\tilde{@}',
      widetilde: '\\widetilde{@}',
      bar: '\\bar{@}',
      vec: '\\vec{@}',
      overrightarrow: '\\overrightarrow{@}',
      overleftarrow: '\\overleftarrow{@}',
      dot: '\\dot{@}',
      ddot: '\\ddot{@}',
      overset: '\\overset{@}{}',
      underset: '\\underset{@}{}',
      boxed: '\\boxed{@}',
      cancel: '\\cancel{@}',
      bcancel: '\\bcancel{@}',
      xcancel: '\\xcancel{@}',
      phantom: '\\phantom{@}',
      xrightarrow: '\\xrightarrow{@}',
      xleftarrow: '\\xleftarrow{@}',
      xleftrightarrow: '\\xleftrightarrow{@}',
      xRightarrow: '\\xRightarrow{@}',
      matrix: '\\begin{matrix} @ & {} \\\\ {} & {} \\end{matrix}',
      pmatrix: '\\begin{pmatrix} @ & {} \\\\ {} & {} \\end{pmatrix}',
      bmatrix: '\\begin{bmatrix} @ & {} \\\\ {} & {} \\end{bmatrix}',
      vmatrix: '\\begin{vmatrix} @ & {} \\\\ {} & {} \\end{vmatrix}',
      cases: '\\begin{cases} @ & {} \\\\ {} & {} \\end{cases}',
    };

    const COMMAND_ENTRIES = (() => {
      const seen = new Map();
      for (const [cmd, latex] of Object.entries(COMMAND_TEMPLATES)) {
        seen.set(cmd, { cmd, kind: 'template', latex, label: '\\' + cmd });
      }
      for (const [cmd, ch] of Object.entries(SYMBOL_CHARS)) {
        if (/^[a-zA-Z]+$/.test(cmd) && !seen.has(cmd)) {
          seen.set(cmd, { cmd, kind: 'symbol', latex: '\\' + cmd, ch, label: ch + '  \\' + cmd });
        }
      }
      for (const fn of FUNCTION_NAMES) {
        if (!seen.has(fn)) {
          seen.set(fn, { cmd: fn, kind: 'symbol', latex: '\\' + fn, ch: fn, label: fn + '  \\' + fn });
        }
      }
      return Array.from(seen.values());
    })();

    function matchCommands(query) {
      const q = query.trim();
      if (q === '') {
        return ['frac', 'sqrt', 'int', 'sum', 'alpha', 'beta', 'pi', 'infty'].map((c) =>
          COMMAND_ENTRIES.find((e) => e.cmd === c)).filter(Boolean);
      }
      const exact = [];
      const prefix = [];
      const ciPrefix = [];
      const lower = q.toLowerCase();
      for (const entry of COMMAND_ENTRIES) {
        if (entry.cmd === q) exact.push(entry);
        else if (entry.cmd.startsWith(q)) prefix.push(entry);
        else if (entry.cmd.toLowerCase().startsWith(lower)) ciPrefix.push(entry);
      }
      prefix.sort((a, b) => a.cmd.length - b.cmd.length || a.cmd.localeCompare(b.cmd));
      ciPrefix.sort((a, b) => a.cmd.length - b.cmd.length || a.cmd.localeCompare(b.cmd));
      return exact.concat(prefix, ciPrefix).slice(0, 8);
    }

    function visualExecuteCommand(latex, cursor, rawCmd, options) {
      const cmd = rawCmd.trim();
      if (cmd === '') return { latex, cursor };
      if (COMMAND_TEMPLATES[cmd] !== undefined) {
        return visualInsertItem(latex, cursor, { kind: 'template', latex: COMMAND_TEMPLATES[cmd] }, options);
      }
      if (INTEGRALS.has(cmd)) {
        return visualInsertItem(latex, cursor, { kind: 'symbol', latex: '\\' + cmd }, options);
      }
      if (BIG_OPERATORS.has(cmd)) {
        return visualInsertItem(latex, cursor, { kind: 'symbol', latex: '\\' + cmd }, options);
      }
      return visualInsertItem(latex, cursor, { kind: 'symbol', latex: '\\' + cmd }, options);
    }

    const CMD_SINGLE_PUNCT = new Set(['{', '}', '%', '&', '#', '_', '$', ',', ';', ':', '!', ' ', '|']);

    const IME_MATH_PUNCT_MAP = {
      '＾': '^',
      '＿': '_',
      '、': '\\',
      '＼': '\\',
      '（': '(',
      '）': ')',
      '【': '[',
      '】': ']',
      '｛': '{',
      '｝': '}',
      '，': ',',
      '＋': '+',
      '－': '-',
      '＝': '=',
      '／': '/',
      '＊': '*',
    };

    function normalizeMathImeChunk(raw) {
      return raw
        .replace(/……/g, '^')
        .replace(/——/g, '_')
        .replace(/[＾＿、＼（）【】｛｝，＋－＝／＊]/g, (m) => IME_MATH_PUNCT_MAP[m] || m);
    }

    /**
     * Pure synchronous processor for raw character streams in the visual editor.
     * Handles single keystrokes, Windows/macOS IME commits, AND zero-delay batched
     * typing (e.g. `\\mathrm d` or `\\frac{a}{b}+1`) without losing state across
     * React render boundaries.
     */
    function visualProcessInput(initialLatex, initialCursor, initialCmdState, raw, options) {
      let curLatex = initialLatex;
      let curCursor = initialCursor;
      let cmdText = initialCmdState ? initialCmdState.text : null;
      let cmdIndex = initialCmdState ? (initialCmdState.index || 0) : 0;
      let justSteppedByBrace = Boolean(initialCmdState && initialCmdState.justSteppedByBrace);
      let explicitFontSlotId = initialCmdState?.explicitFontSlotId || null;
      const charItalic = options?.charItalic !== false;
      let plainRun = '';

      const flushPlain = () => {
        if (plainRun !== '') {
          const preserveCurrentFontSlot = Boolean(explicitFontSlotId && curCursor && curCursor.slotId === explicitFontSlotId);
          const r = visualInsertText(curLatex, curCursor, plainRun, { charItalic, preserveCurrentFontSlot });
          curLatex = r.latex;
          curCursor = r.cursor;
          if (explicitFontSlotId && curCursor.slotId !== explicitFontSlotId) {
            explicitFontSlotId = null;
          }
          plainRun = '';
        }
      };

      // Normalize fullwidth math punctuation emitted when Chinese IME is active outside \text{...}
      let normalizedRaw = String(raw || '');
      if (normalizedRaw !== '') {
        const initDoc = parseVisual(curLatex);
        const initNorm = normalizeVisualCursor(initDoc, curCursor);
        if (!initDoc.slots.get(initNorm.slotId)?.isTextSlot) {
          normalizedRaw = normalizeMathImeChunk(normalizedRaw);
        }
      }

      for (const ch of Array.from(normalizedRaw)) {
        if (cmdText !== null) {
          justSteppedByBrace = false;
          if (/^[a-zA-Z]$/.test(ch)) {
            cmdText += ch;
            cmdIndex = 0;
            continue;
          }
          if (cmdText === '' && CMD_SINGLE_PUNCT.has(ch)) {
            const r = visualInsertItem(curLatex, curCursor, { kind: 'symbol', latex: '\\' + ch }, { charItalic });
            curLatex = r.latex;
            curCursor = r.cursor;
            cmdText = null;
            cmdIndex = 0;
            continue;
          }
          const matched = matchCommands(cmdText);
          const execName = matched[cmdIndex]?.cmd || cmdText;
          const isTemplate = COMMAND_TEMPLATES[execName] !== undefined;
          const r = visualExecuteCommand(curLatex, curCursor, execName, { charItalic });
          curLatex = r.latex;
          curCursor = r.cursor;
          if (['mathrm', 'mathit', 'mathbf', 'mathsf', 'mathtt'].includes(execName)) {
            explicitFontSlotId = curCursor.slotId;
          } else if (explicitFontSlotId && curCursor.slotId !== explicitFontSlotId) {
            explicitFontSlotId = null;
          }
          cmdText = null;
          cmdIndex = 0;
          // Space terminates a command; `{` (or `[` on \nthroot) opens its first template slot
          if (ch === ' ' || (isTemplate && (ch === '{' || (ch === '[' && COMMAND_TEMPLATES[execName].includes('[@]'))))) {
            continue;
          }
          // Otherwise fall through to handle `ch` in normal visual mode
        }

        // Check current slot properties (after flushing any queued plain chars when special keys arrive)
        if (ch === '\\' || ch === '^' || ch === '_' || ch === '}' || (ch === '{' && justSteppedByBrace)) {
          flushPlain();
          const curDoc = parseVisual(curLatex);
          const norm = normalizeVisualCursor(curDoc, curCursor);
          const curSlot = curDoc.slots.get(norm.slotId);

          if (ch === '{' && justSteppedByBrace) {
            justSteppedByBrace = false;
            continue;
          }
          justSteppedByBrace = false;

          if (ch === '\\' && !curSlot?.isTextSlot) {
            cmdText = '';
            cmdIndex = 0;
            continue;
          }
          if ((ch === '^' || ch === '_') && !curSlot?.isTextSlot) {
            const r = visualApplyScriptKey(curLatex, curCursor, ch);
            curLatex = r.latex;
            curCursor = r.cursor;
            if (explicitFontSlotId && curCursor.slotId !== explicitFontSlotId) {
              explicitFontSlotId = null;
            }
            justSteppedByBrace = true;
            continue;
          }
          if (ch === '}' && curSlot && curSlot.id !== 'root' && curSlot.braced && !curSlot.isTextSlot && !curSlot.isMatrixCell) {
            // Closing brace steps to next sibling template slot (e.g. \frac{a}{b}) or exits parent atom
            const parentAtom = curSlot.parentAtomId ? curDoc.atoms.get(curSlot.parentAtomId) : null;
            if (parentAtom && Array.isArray(parentAtom.childSlots)) {
              const posInAtom = parentAtom.childSlots.indexOf(curSlot.id);
              if (posInAtom >= 0 && posInAtom + 1 < parentAtom.childSlots.length) {
                const nextSlotId = parentAtom.childSlots[posInAtom + 1];
                curCursor = { slotId: nextSlotId, index: 0, anchor: null };
                if (explicitFontSlotId && curCursor.slotId !== explicitFontSlotId) {
                  explicitFontSlotId = null;
                }
                justSteppedByBrace = true;
                continue;
              }
            }
            curCursor = visualMoveHorizontal(curDoc, { slotId: curSlot.id, index: curSlot.atoms.length, anchor: null }, 1, false);
            if (explicitFontSlotId && curCursor.slotId !== explicitFontSlotId) {
              explicitFontSlotId = null;
            }
            justSteppedByBrace = true;
            continue;
          }
        } else {
          justSteppedByBrace = false;
        }

        plainRun += ch;
      }

      flushPlain();
      return {
        latex: curLatex,
        cursor: curCursor,
        cmdState: { text: cmdText, index: cmdIndex, justSteppedByBrace, explicitFontSlotId },
      };
    }

    /* =======================================================================
     * 3. Shared state
     * ===================================================================== */

    const STRINGS = {
      zh: {
        title: '数学公式编辑器',
        insert: '插入',
        clear: '清空',
        copy: '复制 LaTeX',
        close: '关闭',
        inline: '行内 $…$',
        block: '独立 $$…$$',
        raw: '纯 LaTeX',
        visualLabel: '可视化编辑（直接输入 · ^ 上标 · _ 下标 · \\ 命令 · Tab 跳格）',
        italicOn: '倾斜',
        italicOff: '不倾斜',
        slantHint: '点击切换字符倾斜或竖直',
        latexLabel: 'LaTeX 源码（双向实时同步）',
        placeholder: '输入 LaTeX，例如 \\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}',
        empty: '点击此处直接输入公式，或点击左侧符号/模板',
        inserted: '已插入到输入框',
        failed: '插入失败：请先在输入框中点击定位光标，然后重试',
        copied: 'LaTeX 已复制',
        copyFailed: '复制失败',
        hint: '可视化区域可直接打字编辑 · Tab 切换方框 · Ctrl+Enter 插入',
        symbols: '符号',
        templates: '模板',
        more: '更多符号',
        less: '收起',
        matrixConfig: '自定义矩阵或向量',
        matrixRows: '行数',
        matrixColumns: '列数',
        matrixAlignment: '对齐',
        alignLeft: '靠左',
        alignCenter: '居中',
        alignRight: '靠右',
        matrixCreate: '插入模板',
        cancel: '取消',
        matrixInvalid: '行数和列数须为 1 至 99 的整数',
        noSession: '请先打开一个会话',
      },
      en: {
        title: 'Math formula editor',
        insert: 'Insert',
        clear: 'Clear',
        copy: 'Copy LaTeX',
        close: 'Close',
        inline: 'Inline $…$',
        block: 'Display $$…$$',
        raw: 'LaTeX only',
        visualLabel: 'Visual editor (type directly · ^ sup · _ sub · \\ cmd · Tab next box)',
        italicOn: 'Italic',
        italicOff: 'Upright',
        slantHint: 'Click to toggle italic or upright characters',
        latexLabel: 'LaTeX source (two-way synced)',
        placeholder: 'Type LaTeX, e.g. \\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}',
        empty: 'Click here to type math directly, or pick a symbol/template',
        inserted: 'Inserted into the composer',
        failed: 'Insert failed — click into the composer to place the caret, then try again',
        copied: 'LaTeX copied',
        copyFailed: 'Copy failed',
        hint: 'Type directly in the visual box · Tab jumps slots · Ctrl+Enter inserts',
        symbols: 'Symbols',
        templates: 'Templates',
        more: 'More symbols',
        less: 'Show fewer',
        matrixConfig: 'Custom matrix or vector',
        matrixRows: 'Rows',
        matrixColumns: 'Columns',
        matrixAlignment: 'Alignment',
        alignLeft: 'Left',
        alignCenter: 'Center',
        alignRight: 'Right',
        matrixCreate: 'Insert template',
        cancel: 'Cancel',
        matrixInvalid: 'Rows and columns must be integers from 1 to 99',
        noSession: 'Open a session first',
      },
    };

    const store = {
      open: false,
      tab: 'greek',
      expanded: {},
      matrixConfig: null,
      latex: '',
      visualCursor: { slotId: 'root', index: 0, anchor: null },
      charItalic: true,
      activeEditor: 'visual',
      visualFocused: false,
      visualSink: null,
      textarea: null,
      history: [],
      future: [],
      mode: 'inline',
      lang: 'zh',
      listeners: new Set(),
      set(patch) {
        Object.assign(this, patch);
        this.emit();
      },
      commitVisual(nextLatex, nextCursor) {
        if (nextLatex !== this.latex) {
          this.history = this.history.slice(-79).concat([{ latex: this.latex, cursor: this.visualCursor }]);
          this.future = [];
        }
        this.latex = nextLatex;
        this.visualCursor = nextCursor;
        this.emit();
      },
      undoVisual() {
        if (this.history.length === 0) return false;
        const prev = this.history[this.history.length - 1];
        this.history = this.history.slice(0, -1);
        this.future = [{ latex: this.latex, cursor: this.visualCursor }].concat(this.future.slice(0, 79));
        this.latex = prev.latex;
        this.visualCursor = prev.cursor;
        this.emit();
        return true;
      },
      redoVisual() {
        if (this.future.length === 0) return false;
        const next = this.future[0];
        this.future = this.future.slice(1);
        this.history = this.history.slice(-79).concat([{ latex: this.latex, cursor: this.visualCursor }]);
        this.latex = next.latex;
        this.visualCursor = next.cursor;
        this.emit();
        return true;
      },
      emit() {
        for (const listener of Array.from(this.listeners)) listener();
      },
      subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      },
    };

    function useStore() {
      const [, bump] = React.useReducer((value) => value + 1, 0);
      React.useEffect(() => store.subscribe(bump), []);
      return store;
    }

    function strings() {
      return STRINGS[store.lang] || STRINGS.zh;
    }

    // AxMath accepts commands that the host's KaTeX renderer does not. Preserve
    // the displayed symbol while generating a form that the host can render.
    const KATEX_COMPAT = {
      blacktriangleup: '\\blacktriangle',
      napprox: '\\not\\approx',
      nsubset: '\\not\\subset',
      nsupset: '\\not\\supset',
      varparallel: '\\parallel',
      parallelequal: '\\mathrel{\\text{⫲}}',
      iiiint: '\\mathop{\\text{⨌}}\\nolimits',
      fint: '\\mathop{\\text{⨏}}\\nolimits',
      varointclockwise: '\\mathop{\\text{∲}}\\nolimits',
      ointclockwise: '\\mathop{\\text{∲}}\\nolimits',
      ointctrclockwise: '\\mathop{\\text{∳}}\\nolimits',
      sumint: '\\mathop{\\text{⨋}}\\nolimits',
      intclockwise: '\\mathop{\\text{∱}}\\nolimits',
      bigsqcap: '\\mathop{\\text{⨅}}\\limits',
      bigtimes: '\\mathop{\\text{⨉}}\\limits',
      dasharrow: '\\dashrightarrow',
      leftsquigarrow: '\\mathrel{\\text{⇜}}',
      textperthousand: '\\text{‰}',
    };
    for (const name of ['abs', 'acos', 'asin', 'atan', 'acot', 'acsc', 'asec',
      'arccot', 'arcsec', 'arccsc', 'sech', 'csch', 'mod']) {
      KATEX_COMPAT[name] = '\\operatorname{' + name + '}';
    }

    function compatibleLatex(source) {
      // Treat a double backslash as a row separator, not the start of a command.
      return source.replace(/\\\\|\\([a-zA-Z]+)/g, (command, name) =>
        name !== undefined && KATEX_COMPAT[name] !== undefined ? KATEX_COMPAT[name] : command);
    }

    function insertIntoSnippet(item) {
      if (store.activeEditor === 'visual' && store.visualSink !== null && store.visualSink !== undefined) {
        const res = visualInsertItem(store.latex, store.visualCursor, item, { charItalic: store.charItalic });
        store.commitVisual(res.latex, res.cursor);
        const focusVisual = () => {
          if (store.visualSink !== null && store.visualSink !== undefined) {
            store.visualSink.focus({ preventScroll: true });
          }
        };
        focusVisual();
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(focusVisual);
        else setTimeout(focusVisual, 0);
        return;
      }

      const textarea = store.textarea;
      const start = textarea !== null && textarea !== undefined ? textarea.selectionStart : store.latex.length;
      const end = textarea !== null && textarea !== undefined ? textarea.selectionEnd : store.latex.length;
      const compatible = compatibleLatex(item.latex);
      const marker = compatible.indexOf('@');
      const selected = store.latex.slice(start, end);
      const snippet = (marker >= 0
        ? compatible.slice(0, marker) + selected + compatible.slice(marker + 1).replace(/@/g, '')
        : compatible)
        + (item.kind === 'symbol' && /\\[a-zA-Z]+$/.test(compatible) ? ' ' : '');
      const next = store.latex.slice(0, start) + snippet + store.latex.slice(end);
      const caret = marker >= 0 ? start + marker + selected.length : start + snippet.length;
      const nextDoc = parseVisual(next);
      store.set({ latex: next, visualCursor: offsetToVisualCursor(nextDoc, caret) });
      const focus = () => {
        if (store.textarea === null || store.textarea === undefined) return;
        store.textarea.focus();
        store.textarea.setSelectionRange(caret, caret);
      };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(focus);
      else setTimeout(focus, 0);
    }

    function formulaForDraft() {
      const body = store.latex.trim();
      if (body === '') return '';
      if (store.mode === 'raw') return body;
      if (store.mode === 'block') return '\n$$\n' + body + '\n$$\n';
      return '$' + body + '$';
    }

    function insertIntoComposer(inputActions) {
      const text = formulaForDraft();
      if (text === '') return 'empty';
      if (inputActions === undefined || inputActions === null ||
          typeof inputActions.captureInsertion !== 'function' ||
          typeof inputActions.insertText !== 'function') {
        return 'unavailable';
      }
      try {
        const span = inputActions.captureInsertion();
        return inputActions.insertText(text, span) === true ? 'ok' : 'failed';
      } catch (error) {
        return 'failed';
      }
    }

    /* =======================================================================
     * 4. Components
     * ===================================================================== */

    const CSS = `
.dme-panel{flex:none;container-type:inline-size;display:flex;flex-direction:column;width:calc(100% - 2 * var(--dsh-composer-side-clearance,0px));max-width:var(--dsh-composer-card-max-width,960px);max-height:max(320px,calc(var(--dsh-conversation-viewport-height,100dvh) - 140px));box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:13px;margin:0 auto 8px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.08)}
.dme-head{flex:none;display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2)}
.dme-logo{flex:none;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:var(--dsw-alias-brand-primary);color:#fff;font-size:14px;font-weight:700;font-family:Georgia,serif}
.dme-title{flex:none;font-weight:600;font-size:13px;white-space:nowrap}
.dme-hint{flex:1 1 auto;min-width:0;color:var(--dsw-alias-label-secondary);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dme-head-right{flex:none;display:flex;align-items:center;gap:6px;margin-left:auto}
.dme-seg{flex:none;display:inline-flex;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;overflow:hidden;background:var(--dsw-alias-bg-base)}
.dme-seg button{border:0;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;padding:4px 9px;cursor:pointer;white-space:nowrap}
.dme-seg button+button{border-left:1px solid var(--dsw-alias-border-l1)}
.dme-seg button[aria-pressed="true"]{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-weight:600}
.dme-close{flex:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:7px;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);font-size:16px;line-height:1;cursor:pointer}
.dme-close:hover{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l1)}
.dme-tabs{flex:none;display:flex;flex-wrap:wrap;align-items:center;gap:3px 4px;padding:6px 10px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dme-group{display:inline-flex;align-items:center;color:var(--dsw-alias-label-secondary);font-size:11px;white-space:nowrap;padding:0 2px 0 6px;opacity:.75}
.dme-tab{flex:none;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;padding:3px 9px;border-radius:999px;cursor:pointer;white-space:nowrap}
.dme-tab:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dme-tab[aria-selected="true"]{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary);font-weight:600}
.dme-body{flex:1 1 auto;min-height:0;overflow-y:auto;display:flex;gap:12px;padding:10px 12px 12px;align-items:stretch;scrollbar-width:thin}
.dme-catalog{flex:1.15 1 280px;min-width:0;display:flex;flex-direction:column;gap:4px}
.dme-grid{flex:1 1 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(46px,1fr));gap:4px;min-height:156px;max-height:248px;overflow-y:auto;align-content:start;padding-right:4px;scrollbar-width:thin}
.dme-cell{display:flex;align-items:center;justify-content:center;height:42px;padding:0 3px;border-radius:7px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);cursor:pointer;overflow:hidden;font-size:18px;line-height:1}
.dme-cell:hover{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-overlay)}
.dme-cell:active{transform:translateY(1px)}
.dme-catalog-toggle{flex:none;align-self:flex-end;font-size:11px;line-height:1.2}
.dme-cell-glyph{font-family:'Cambria Math','STIX Two Math','Latin Modern Math','Times New Roman',serif;font-style:normal;font-size:19px}
.dme-cell-bold{font-weight:700}
.dme-grid-greek .dme-cell-glyph{font-style:italic}
.dme-grid-greek.is-upright .dme-cell-glyph{font-style:normal}
.dme-cell-word{font-family:'Cambria Math',Georgia,serif;font-size:12px;font-style:normal}
.dme-cell .dme-math{font-size:13.5px;line-height:1.18}
.dme-grid-radical{grid-template-columns:repeat(auto-fill,minmax(52px,1fr))}
.dme-grid-radical .dme-cell{height:46px}
.dme-grid-accent{grid-template-columns:repeat(auto-fill,minmax(54px,1fr))}
.dme-grid-accent .dme-cell{height:46px}
.dme-grid-bracket{grid-template-columns:repeat(auto-fill,minmax(52px,1fr))}
.dme-grid-bracket .dme-cell{height:46px}
.dme-grid-integral{grid-template-columns:repeat(auto-fill,minmax(66px,1fr))}
.dme-grid-integral .dme-cell{height:50px}
.dme-grid-bigops{grid-template-columns:repeat(auto-fill,minmax(58px,1fr))}
.dme-grid-bigops .dme-cell{height:50px}
.dme-grid-arrow .dme-cell{height:54px}
.dme-grid-arrow .dme-matrix td{padding:0 .08em;line-height:1}
.dme-grid-matrix{grid-template-columns:repeat(auto-fill,minmax(86px,1fr))}
.dme-grid-matrix .dme-cell{height:58px}
.dme-grid-matrix .dme-math{font-size:11px}
.dme-grid-matrix .dme-matrix td{padding:.02em .08em;line-height:1.05}
.dme-matrix-icon{display:block;flex:none;width:64px;height:54px;max-width:100%;max-height:100%}
.dme-root-icon{display:block;flex:none;width:44px;height:34px;max-width:100%;max-height:100%}
.dme-side{flex:1 1 320px;max-width:420px;min-width:260px;display:flex;flex-direction:column;gap:6px}
.dme-matrix-config{flex:none;display:flex;flex-wrap:wrap;align-items:end;gap:8px;padding:8px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-2)}
.dme-matrix-config-title{flex-basis:100%;font-weight:600}
.dme-matrix-config label{display:flex;flex-direction:column;gap:3px;color:var(--dsw-alias-label-secondary);font-size:11px}
.dme-matrix-config input,.dme-matrix-config select{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);padding:4px;font-size:12px}
.dme-matrix-config input{width:58px}
.dme-editor-label{flex:none;font-size:11px;color:var(--dsw-alias-label-secondary);display:flex;align-items:center;justify-content:space-between;gap:6px;line-height:1.2;user-select:none;padding:0 2px}
.dme-editor-label-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dme-slant-toggle{flex:none;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:11.5px;font-weight:500;line-height:1.2;padding:2px 8px;cursor:pointer;white-space:nowrap;transition:border-color .14s,background .14s,color .14s}
.dme-slant-toggle:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.dme-slant-toggle.is-upright{border-color:var(--dsw-alias-brand-primary);background:rgba(77,107,254,.12);color:var(--dsw-alias-brand-primary);font-weight:600}
.dme-visual{flex:none;box-sizing:border-box;position:relative;min-height:84px;max-height:176px;overflow:auto;display:flex;align-items:center;justify-content:flex-start;padding:10px 14px;border:1.5px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-base);cursor:text;user-select:none;outline:none;transition:border-color .14s,box-shadow .14s}
.dme-visual.is-focused{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px rgba(77,107,254,.14)}
.dme-visual-sink{position:absolute;left:14px;top:50%;width:2px;height:1.2em;opacity:0;pointer-events:none;border:0;padding:0;margin:0;resize:none;overflow:hidden;background:transparent;color:transparent;caret-color:transparent;z-index:2}
.dme-ime-preedit{display:inline-block;font-style:normal;font-size:.82em;line-height:1.1;border-bottom:1.5px dashed var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);padding:0 1px;margin:0 1px}
.dme-preview-empty{color:var(--dsw-alias-label-secondary);font-size:12px;pointer-events:none}
.dme-slot{display:inline-flex;align-items:center;min-height:.84em;border-radius:3px;position:relative;padding:0 1px}
.dme-slot-root{min-height:1.25em;padding:2px 3px}
.dme-slot-empty{min-width:.68em;height:.8em;border:1.25px dashed var(--dsw-alias-label-secondary);background:rgba(127,127,127,.06);margin:0 .05em;justify-content:center;cursor:pointer;opacity:.85;box-sizing:border-box}
.dme-slot-empty:hover{border-color:var(--dsw-alias-brand-primary);opacity:1;background:rgba(77,107,254,.08)}
.dme-slot-empty.is-active{border-style:solid;border-color:var(--dsw-alias-brand-primary);background:rgba(77,107,254,.12);opacity:1}
.dme-slot-active:not(.dme-slot-root):not(.dme-slot-empty){outline:1px dashed rgba(77,107,254,.45);outline-offset:1px;background:rgba(77,107,254,.04)}
.dme-atom{display:inline-flex;align-items:center;position:relative;border-radius:2px}
.dme-atom-selected{background:rgba(77,107,254,.24);border-radius:3px}
.dme-caret{display:inline-block;width:0;height:1.06em;border-left:1.8px solid var(--dsw-alias-brand-primary);margin:0 -.9px;vertical-align:middle;pointer-events:none;animation:dme-blink 1.04s steps(1) infinite;z-index:3}
@keyframes dme-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
.dme-vis-phantom{visibility:visible!important;opacity:.45;border:1px dashed currentColor;border-radius:3px;padding:0 .08em}
.dme-vis-hspace{display:inline-flex;align-items:center;gap:2px;font-size:.6em;font-family:Consolas,monospace;border:1px dashed var(--dsw-alias-border-l1);border-radius:4px;padding:0 4px;margin:0 2px;opacity:.85}
.dme-vis-space{display:inline-block;border-bottom:1px dotted rgba(127,127,127,.45);min-height:.35em}
.dme-cmd-pill{display:inline-flex;align-items:center;font-family:'Cascadia Code',Consolas,monospace;font-size:.68em;font-style:normal;background:rgba(77,107,254,.12);border:1px solid var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);border-radius:4px;padding:1px 5px;margin:0 2px;line-height:1.25}
.dme-cmd-menu{flex:none;display:flex;flex-wrap:wrap;gap:4px;padding:5px 7px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);font-size:11.5px}
.dme-cmd-item{border:1px solid transparent;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:5px;padding:2px 7px;font-family:'Cascadia Code',Consolas,monospace;font-size:11.5px;cursor:pointer}
.dme-cmd-item.is-selected,.dme-cmd-item:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.dme-input{flex:none;width:100%;box-sizing:border-box;min-height:48px;max-height:110px;resize:vertical;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);padding:6px 9px;font-family:'Cascadia Code',Consolas,'Courier New',monospace;font-size:12px;line-height:1.45}
.dme-input:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.dme-foot{flex:none;display:flex;align-items:center;gap:8px;margin-top:2px}
.dme-status{margin-right:auto;font-size:11.5px;color:var(--dsw-alias-label-secondary);min-height:16px}
.dme-status[data-tone="ok"]{color:var(--dsw-alias-state-success-primary)}
.dme-status[data-tone="error"]{color:var(--dsw-alias-state-error-primary)}
.dme-btn{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:12px;padding:5px 11px;border-radius:8px;cursor:pointer;white-space:nowrap}
.dme-btn:hover{background:var(--dsw-alias-bg-overlay)}
.dme-btn-primary{border-color:transparent;background:var(--dsw-alias-brand-primary);color:#fff;font-weight:600}
.dme-btn-primary:hover{filter:brightness(1.06)}
.dme-panel-error{padding:12px 14px;gap:6px;border-color:var(--dsw-alias-state-error-primary)}
.dme-error-title{font-weight:600;color:var(--dsw-alias-state-error-primary);font-size:13px}
.dme-error-body{font-family:Consolas,monospace;font-size:12px;color:var(--dsw-alias-label-secondary);white-space:pre-wrap;line-height:1.5}
.dme-launch{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;padding:0}
.dme-launch:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dme-launch[aria-expanded="true"]{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l1);color:var(--dsw-alias-brand-primary)}
.dme-launch svg{display:block;width:17px;height:17px}

.dme-math{--dme-var-style:italic;display:inline-flex;align-items:center;white-space:nowrap;font-family:'Cambria Math','STIX Two Math','Latin Modern Math','Times New Roman',serif;font-size:21px;line-height:1.4;font-style:normal;color:inherit}
.dme-math-mini{font-size:13.5px;line-height:1.2}
.dme-var{font-style:var(--dme-var-style,italic)}
.dme-num,.dme-sym{font-style:normal}
.dme-sym{margin:0 .04em}
.dme-placeholder{display:inline-block;width:.64em;height:.64em;vertical-align:middle;overflow:visible;opacity:.82}
.dme-func{--dme-var-style:normal;font-style:normal;margin:0 .14em 0 .08em}
.dme-text{--dme-var-style:normal;font-style:normal;white-space:pre-wrap}
.dme-unknown{color:var(--dsw-alias-state-error-primary);font-style:normal}
.dme-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 .12em;line-height:1.12}
.dme-frac-num{padding:0 .2em .06em;border-bottom:1.35px solid currentColor;min-width:.5em;display:inline-flex;justify-content:center;align-items:center}
.dme-frac-den{padding:.06em .2em 0;min-width:.5em;display:inline-flex;justify-content:center;align-items:center}
.dme-binom{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15;margin:0 .06em}
.dme-binom-top,.dme-binom-bottom{padding:.02em .1em;display:inline-flex;justify-content:center;align-items:center}
.dme-sqrt{display:inline-flex;align-items:stretch;vertical-align:middle;margin:0 .08em;position:relative}
.dme-sqrt-surd{position:relative;display:inline-block;width:.62em;min-height:1.18em;flex:0 0 .62em;align-self:stretch}
.dme-sqrt-svg{position:absolute;left:0;top:.675px;width:100%;height:calc(100% - 1.35px);overflow:visible;display:block}
.dme-sqrt-body{border-top:1.35px solid currentColor;padding:.08em .18em .03em .08em;display:inline-flex;align-items:center}
.dme-sqrt-index{font-size:.56em;align-self:flex-start;transform:translateY(-.16em);margin-right:-.32em;z-index:1;line-height:1}
.dme-script{display:inline-flex;align-items:center;vertical-align:middle}
.dme-scripts{display:inline-grid;grid-template-rows:minmax(.64em,auto) minmax(.64em,auto);align-items:center;font-size:.65em;line-height:1.1;margin-left:.05em;vertical-align:middle}
.dme-sup{grid-row:1;align-self:end;transform:translateY(-.07em);display:inline-flex;align-items:center}
.dme-sub{grid-row:2;align-self:start;transform:translateY(.07em);display:inline-flex;align-items:center}
.dme-bigop{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 .16em;line-height:1.02}
.dme-opchar{font-size:1.48em;line-height:1;font-style:normal;display:inline-flex;align-items:center;justify-content:center}
.dme-lim{font-size:.58em;line-height:1.12;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center}
.dme-integral{display:inline-flex;align-items:center;vertical-align:middle;margin:0 .08em}
.dme-integral .dme-opchar,.dme-integral-stack .dme-opchar{font-size:1.72em}
.dme-int-svg{display:block;overflow:visible}
.dme-integral-scripts{grid-template-rows:minmax(.9em,auto) minmax(.9em,auto);margin-left:-.03em;font-size:.6em}
.dme-integral-scripts .dme-sup{transform:translateY(-.1em)}
.dme-integral-scripts .dme-sub{transform:translateY(.1em)}
.dme-delim-wrap,.dme-matrix-wrap{display:inline-flex;align-items:stretch;vertical-align:middle}
.dme-matrix-wrap{margin:0 .12em}
.dme-delim{display:inline-flex;align-self:stretch;min-height:1.22em;line-height:1;font-style:normal}
.dme-delim-svg{height:100%;min-height:1.22em;display:block;overflow:visible}
.dme-delim-mid{margin:0 .08em}
.dme-delim-body{display:inline-flex;align-items:center;padding:.03em .05em}
.dme-matrix{border-collapse:collapse}
.dme-matrix td{padding:.12em .26em;text-align:center;vertical-align:middle;line-height:1.3}
.dme-matrix td.dme-align-left{text-align:left}
.dme-matrix td.dme-align-right{text-align:right}
.dme-xarrow{display:inline-flex;flex-direction:column;align-items:stretch;vertical-align:middle;line-height:1.05;margin:0 .1em;min-width:1.45em}
.dme-xarrow-label{font-size:.6em;min-height:.22em;text-align:center;padding:0 .2em;display:inline-flex;justify-content:center;align-items:center}
.dme-xarrow-mark{min-width:1.45em;text-align:center;font-style:normal}
.dme-xarrow-stretch{display:inline-flex;align-items:center;width:100%;min-height:.42em}
.dme-xarrow-double{flex:1 1 auto;min-width:.5em;height:2.4px;border-top:1.2px solid currentColor;border-bottom:1.2px solid currentColor}
.dme-xarrow-head{width:.38em;height:.38em;flex:none;display:block;overflow:visible}
.dme-xarrow-dual{display:inline-flex;flex-direction:column;gap:1.5px;width:100%;padding:1px 0}
.dme-xarrow-row{display:flex;align-items:center;width:100%;height:.22em}
.dme-xarrow-head-sm{width:.32em;height:.28em;flex:none;display:block;overflow:visible}
.dme-stack{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.08}
.dme-stack-under{flex-direction:column-reverse}
.dme-stack-top{font-size:.62em;line-height:1.08;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center}
.dme-stack-base{line-height:1.14;display:inline-flex;align-items:center;justify-content:center}
.dme-not{position:relative;display:inline-flex;align-items:center}
.dme-not:after{content:"/";position:absolute;inset:0;text-align:center;pointer-events:none}
.dme-decoration{position:relative;display:inline-flex;align-items:center}
.dme-decoration-sout{text-decoration:line-through}
.dme-decoration-boxed,.dme-decoration-colorbox{padding:.08em .18em}
.dme-decoration-boxed{border:1.25px solid currentColor}
.dme-decoration-cancel:after,.dme-decoration-bcancel:after,.dme-decoration-xcancel:after,.dme-decoration-xcancel:before{content:"";position:absolute;left:0;top:50%;width:100%;border-top:1.2px solid currentColor;transform:rotate(-32deg);pointer-events:none}
.dme-decoration-bcancel:after,.dme-decoration-xcancel:before{transform:rotate(32deg)}
.dme-accent{position:relative;display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;padding-top:.42em}
.dme-accent-wide{min-width:.8em}
.dme-accent-body{display:inline-flex;align-items:center}
.dme-accent-mark{position:absolute;left:0;right:0;top:-.02em;text-align:center;font-size:.78em;line-height:1;font-style:normal;pointer-events:none}
.dme-accent-svg-wrap{top:.02em;height:.36em;display:flex;align-items:center}
.dme-accent-svg{width:100%;height:100%;display:block;overflow:visible}
.dme-accent-arrow{top:.03em;height:.34em;display:flex;align-items:center;padding:0 .02em}
.dme-arrow-shaft{flex:1 1 auto;min-width:.35em;height:0;border-top:1.3px solid currentColor}
.dme-arrow-tip{width:.34em;height:.34em;flex:none;display:block;overflow:visible}
.dme-accent-below{padding-top:0;padding-bottom:.42em}
.dme-accent-below .dme-accent-mark{top:auto;bottom:-.02em}
.dme-accent-below .dme-accent-svg-wrap{top:auto;bottom:.02em}
.dme-accent-below .dme-accent-arrow{top:auto;bottom:.03em}
.dme-overunder-wrap{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.08}
.dme-overunder-label{font-size:.6em;line-height:1.1;padding:0 .08em;display:inline-flex;align-items:center;justify-content:center}
.dme-brace-wrap{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.1}
.dme-brace-body{display:inline-flex;align-items:center;padding:0 .12em}
.dme-brace-svg-wrap{width:100%;min-width:.9em;height:.36em;display:block}
.dme-brace-svg{width:100%;height:100%;display:block;overflow:visible}
.dme-line-top{border-top:1.35px solid currentColor;padding-top:.08em;display:inline-flex;align-items:center}
.dme-line-bottom{border-bottom:1.35px solid currentColor;padding-bottom:.08em;display:inline-flex;align-items:center}
.dme-longdiv{display:inline-flex;align-items:stretch;vertical-align:middle}
.dme-longdiv-curve{position:relative;width:.32em;min-height:1.15em;flex:0 0 .32em}
.dme-longdiv-svg{position:absolute;left:0;top:.675px;width:100%;height:calc(100% - .675px);overflow:visible;display:block}
.dme-longdiv-body{padding-left:.1em;padding-right:.14em}
.dme-frame{display:inline-flex;align-items:stretch;vertical-align:middle;position:relative;margin:0 .04em}
.dme-frame-body{display:inline-flex;align-items:center;padding:.08em .16em}
.dme-frame-top .dme-frame-body{border-top:1.35px solid currentColor}
.dme-frame-bottom .dme-frame-body{border-bottom:1.35px solid currentColor}
.dme-frame-l-corner .dme-frame-body{border-left:1.35px solid currentColor}
.dme-frame-r-corner .dme-frame-body{border-right:1.35px solid currentColor}
.dme-frame-arrow{position:relative;width:.36em;flex:0 0 .36em;display:inline-flex;flex-direction:column;align-items:center}
.dme-frame-arrow svg:first-child{width:100%;height:100%;display:block;overflow:visible}
.dme-frame-arrow-tip{position:absolute;width:.38em;height:.28em;overflow:visible}
.dme-frame-arrow-tip.is-down{bottom:-.05em}
.dme-frame-arrow-tip.is-up{top:-.05em}
.dme-phantom{visibility:hidden}
.dme-font-mathbb,.dme-font-mathcal,.dme-font-mathfrak{--dme-var-style:normal;font-style:normal}
.dme-font-mathbf{font-weight:700}
.dme-font-mathsf{--dme-var-style:normal;font-family:'Segoe UI',sans-serif;font-style:normal}
.dme-font-mathtt{--dme-var-style:normal;font-family:Consolas,monospace;font-style:normal}
.dme-font-mathrm{--dme-var-style:normal;font-style:normal}
.dme-font-mathit{--dme-var-style:italic;font-style:italic}
@container (max-width: 720px){.dme-hint{display:none}}
@container (max-width: 600px){.dme-body{flex-direction:column}.dme-catalog,.dme-side{flex:none;max-width:none;min-width:0}.dme-grid{max-height:176px}}
@media (max-width: 680px){.dme-body{flex-direction:column}.dme-catalog,.dme-side{flex:none;max-width:none;min-width:0}.dme-grid{max-height:176px}.dme-hint{display:none}}
`;

    function Style() {
      return h('style', { dangerouslySetInnerHTML: { __html: CSS } });
    }

    function RadicalIcon() {
      return h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true' },
        h('path', {
          d: 'M3 13h3.2l2.6 6.4L14.6 4.6H21',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      );
    }

    function Launcher() {
      useStore();
      const text = strings();
      return h(
        React.Fragment,
        null,
        h(Style),
        h(
          'button',
          {
            type: 'button',
            className: 'dme-launch',
            title: text.title,
            'aria-label': text.title,
            'aria-expanded': store.open ? 'true' : 'false',
            onMouseDown: (event) => event.preventDefault(),
            onClick: (event) => {
              if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
              const nextOpen = !store.open;
              if (nextOpen) {
                store.set({ open: true, activeEditor: 'visual' });
                const focusVis = () => {
                  if (store.open && store.visualSink) {
                    store.visualSink.focus({ preventScroll: true });
                  }
                };
                if (typeof requestAnimationFrame === 'function') requestAnimationFrame(focusVis);
                else setTimeout(focusVis, 0);
              } else {
                store.set({ open: false, visualFocused: false });
              }
            },
          },
          h(RadicalIcon),
        ),
      );
    }

    // AxMath-style mini icons for spacing (-3, 1, 3, 4, 5, 1M, 2M, xM) and phantom (both, h, v) buttons.
    function RootSpecialIcon({ kind, label, gap, dashed, mode }) {
      if (kind === 'phantom') {
        return h(
          'svg',
          { className: 'dme-root-icon', viewBox: '0 0 44 34', fill: 'none', stroke: 'currentColor', 'aria-hidden': 'true' },
          h('rect', { x: 11, y: 6, width: 22, height: 22, strokeWidth: 1.2, strokeDasharray: '2.2 1.6', opacity: 0.72 }),
          mode === 'both' || mode === 'h'
            ? h('path', { d: 'M 14 17 H 30 M 16.5 14.5 L 13.8 17 L 16.5 19.5 M 27.5 14.5 L 30.2 17 L 27.5 19.5', strokeWidth: 1.25, strokeLinecap: 'round', strokeLinejoin: 'round' })
            : null,
          mode === 'both' || mode === 'v'
            ? h('path', { d: 'M 22 9 V 25 M 19.5 11.5 L 22 8.8 L 24.5 11.5 M 19.5 22.5 L 22 25.2 L 24.5 22.5', strokeWidth: 1.25, strokeLinecap: 'round', strokeLinejoin: 'round' })
            : null,
        );
      }
      const g = Math.max(2, gap || 2);
      const cx = 22;
      const lx = cx - g / 2;
      const rx = cx + g / 2;
      return h(
        'svg',
        { className: 'dme-root-icon', viewBox: '0 0 44 34', fill: 'none', 'aria-hidden': 'true' },
        h('rect', { x: lx - 6.5, y: 6, width: 6.5, height: 11, stroke: 'currentColor', strokeWidth: 1.15, opacity: 0.65 }),
        h('rect', { x: rx, y: 6, width: 6.5, height: 11, stroke: 'currentColor', strokeWidth: 1.15, opacity: 0.65 }),
        h('path', {
          d: `M ${lx} 4 V 19 M ${rx} 4 V 19`,
          stroke: 'currentColor',
          strokeWidth: 1.2,
          strokeDasharray: dashed ? '1.8 1.3' : undefined,
        }),
        h('text', {
          x: cx,
          y: 29.5,
          textAnchor: 'middle',
          fill: 'currentColor',
          fontSize: '9.5',
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontWeight: '600',
        }, label),
      );
    }

    // A single vector keeps the cells and delimiters intact at the host's UI scale.
    function MatrixIcon({ environment, rows, columns, custom, alignedEq }) {
      const size = 5;
      const gap = 9;
      const width = size + (columns - 1) * gap;
      const height = size + (rows - 1) * gap;
      const x = (64 - width - (alignedEq ? 10 : 0)) / 2;
      const y = (54 - height) / 2;
      const top = y - 3;
      const bottom = y + height + 3;
      const mid = (top + bottom) / 2;
      const left = x - 6;
      const right = x + width + 6 + (alignedEq ? 10 : 0);
      const brackets = [];
      if (environment === 'pmatrix') {
        brackets.push(`M ${left + 3} ${top} C ${left - 2} ${top + 3}, ${left - 2} ${bottom - 3}, ${left + 3} ${bottom}`);
        brackets.push(`M ${right - 3} ${top} C ${right + 2} ${top + 3}, ${right + 2} ${bottom - 3}, ${right - 3} ${bottom}`);
      } else if (environment === 'bmatrix') {
        brackets.push(`M ${left + 3} ${top} H ${left} V ${bottom} H ${left + 3}`);
        brackets.push(`M ${right - 3} ${top} H ${right} V ${bottom} H ${right - 3}`);
      } else if (environment === 'vmatrix') {
        brackets.push(`M ${left} ${top} V ${bottom}`, `M ${right} ${top} V ${bottom}`);
      } else if (environment === 'leftbrace' || environment === 'cases') {
        brackets.push(`M ${left + 3} ${top} C ${left - 1} ${top}, ${left + 2} ${mid - 3}, ${left - 2} ${mid} C ${left + 2} ${mid + 3}, ${left - 1} ${bottom}, ${left + 3} ${bottom}`);
      } else if (environment === 'rightbrace') {
        brackets.push(`M ${right - 3} ${top} C ${right + 1} ${top}, ${right - 2} ${mid - 3}, ${right + 2} ${mid} C ${right - 2} ${mid + 3}, ${right + 1} ${bottom}, ${right - 3} ${bottom}`);
      }
      if (alignedEq) {
        for (let r = 0; r < rows; r += 1) {
          const cy = y + r * gap + size / 2;
          brackets.push(`M ${x + size + 2.5} ${cy - 1.2} H ${x + size + 7.5} M ${x + size + 2.5} ${cy + 1.2} H ${x + size + 7.5}`);
        }
      }
      const cells = [];
      const dots = [];
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const cx = x + column * gap;
          const cy = y + row * gap;
          const isDotSlot = Boolean(custom) && (
            (rows > 1 && row === 1 && (columns === 1 || column <= 1)) ||
            (columns > 1 && column === 1 && (rows === 1 || row <= 1))
          );
          if (isDotSlot) {
            dots.push(
              h('circle', { key: `d-${row}-${column}-a`, cx: cx + 1.2, cy: cy + 2.5, r: 0.75, fill: 'currentColor', stroke: 'none' }),
              h('circle', { key: `d-${row}-${column}-b`, cx: cx + 3.8, cy: cy + 2.5, r: 0.75, fill: 'currentColor', stroke: 'none' }),
            );
          } else {
            cells.push(h('rect', { key: row + '-' + column, x: cx, y: cy, width: size, height: size, fill: 'currentColor', fillOpacity: 0.07 }));
          }
        }
      }
      return h('svg', { className: 'dme-matrix-icon', viewBox: '0 0 64 54', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.3, 'aria-hidden': 'true' },
      ...brackets.map((d, index) => h('path', { key: 'bracket-' + index, d })), ...cells, ...dots);
    }

    function CellButton({ item, text }) {
      const isWord = item.kind === 'symbol' && Array.from(item.ch).length > 1;
      const isBoldSym = item.kind === 'symbol' && typeof item.latex === 'string' && item.latex.startsWith('\\boldsymbol{');
      return h(
        'button',
        {
          type: 'button',
          className: 'dme-cell',
          title: (item.name ? item.name + ' — ' : '') + (item.latex || text.matrixConfig),
          'aria-label': (item.name || item.latex) + ', ' + text.insert,
          onMouseDown: (event) => event.preventDefault(),
          onClick: (event) => {
            event.preventDefault();
            if (item.kind === 'matrixCustom') {
              store.set({ matrixConfig: { item, rows: item.rowInput ? (item.environment === 'array' ? 2 : 3) : 1,
                columns: item.columnInput ? 3 : 1, alignment: 'l' } });
            } else insertIntoSnippet(item);
          },
        },
        item.rootIcon ? h(RootSpecialIcon, item.rootIcon)
          : item.matrixPreview ? h(MatrixIcon, item.matrixPreview)
          : item.kind === 'template' || item.kind === 'matrixCustom'
            ? renderMath(item.preview, { mini: true })
            : h('span', { className: isWord ? 'dme-cell-word' : isBoldSym ? 'dme-cell-glyph dme-cell-bold' : 'dme-cell-glyph' }, item.ch),
      );
    }

    /* ---------------------- Interactive Visual Renderer ---------------------- */

    function detectVisualConnectedFrame(atoms, index) {
      const a = atoms[index];
      const b = atoms[index + 1];
      const c = atoms[index + 2];
      if (a?.type === 'sym' && a.ch === '⌜' && b?.type === 'line' && b.position === 'top') {
        const hasArrow = c?.type === 'sym' && c.ch === '↓';
        return { count: hasArrow ? 3 : 2, position: 'top', left: 'corner', right: hasArrow ? 'arrow' : null, lineAtom: b };
      }
      if (a?.type === 'sym' && a.ch === '⌞' && b?.type === 'line' && b.position === 'bottom') {
        const hasArrow = c?.type === 'sym' && c.ch === '↑';
        return { count: hasArrow ? 3 : 2, position: 'bottom', left: 'corner', right: hasArrow ? 'arrow' : null, lineAtom: b };
      }
      if (a?.type === 'sym' && a.ch === '↓' && b?.type === 'line' && b.position === 'top' && c?.type === 'sym' && c.ch === '⌝') {
        return { count: 3, position: 'top', left: 'arrow', right: 'corner', lineAtom: b };
      }
      if (a?.type === 'sym' && a.ch === '↑' && b?.type === 'line' && b.position === 'bottom' && c?.type === 'sym' && c.ch === '⌟') {
        return { count: 3, position: 'bottom', left: 'arrow', right: 'corner', lineAtom: b };
      }
      if (a?.type === 'line' && a.position === 'top' && b?.type === 'sym' && b.ch === '⌝') {
        return { count: 2, position: 'top', left: null, right: 'corner', lineAtom: a };
      }
      if (a?.type === 'line' && a.position === 'bottom' && b?.type === 'sym' && b.ch === '⌟') {
        return { count: 2, position: 'bottom', left: null, right: 'corner', lineAtom: a };
      }
      return null;
    }

    function renderVisualDoc(doc, cursor, focused, cmdText, handlers, imeText) {
      const norm = normalizeVisualCursor(doc, cursor);
      const [selStart, selEnd] = selectedBounds(norm);

      function caretEl(key) {
        if (!focused) return null;
        if (cmdText !== null) {
          return h('span', { key, className: 'dme-cmd-pill' }, '\\' + cmdText, h('span', { className: 'dme-caret' }));
        }
        if (imeText) {
          return h(
            React.Fragment,
            { key },
            h('span', { className: 'dme-ime-preedit' }, imeText),
            h('span', { className: 'dme-caret' }),
          );
        }
        return h('span', { key, className: 'dme-caret' });
      }

      function renderSlot(slotId, extraClass) {
        const slot = doc.slots.get(slotId);
        if (!slot) return null;
        const isCurrent = norm.slotId === slot.id;
        const isEmpty = slot.atoms.length === 0;

        if (isEmpty && slot.id !== 'root') {
          const cls = 'dme-slot dme-slot-empty' +
            (isCurrent && focused ? ' is-active' : '') +
            (extraClass ? ' ' + extraClass : '');
          return h(
            'span',
            {
              key: slot.id,
              className: cls,
              'data-slot-id': slot.id,
              onMouseDown: (e) => handlers.onSlotMouseDown(e, slot.id, 0),
            },
            isCurrent && selStart === selEnd ? caretEl('caret-empty') : null,
          );
        }

        const children = [];
        if (isCurrent && selStart === selEnd && norm.index === 0) {
          children.push(caretEl('caret-0'));
        }

        let i = 0;
        while (i < slot.atoms.length) {
          const frame = detectVisualConnectedFrame(slot.atoms, i);
          if (frame !== null) {
            const endIdx = i + frame.count;
            const isSelected = isCurrent && selStart < endIdx && selEnd > i;
            children.push(h(
              'span',
              {
                key: slot.atoms[i].id + '-frame',
                className: 'dme-atom' + (isSelected ? ' dme-atom-selected' : ''),
                onMouseDown: (e) => handlers.onAtomMouseDown(e, slot.id, i, endIdx),
                onMouseEnter: (e) => handlers.onAtomMouseEnter(e, slot.id, i, endIdx),
              },
              renderFrameWrap(frame.position, frame.left, frame.right, renderSlot(frame.lineAtom.bodySlotId), 'fw'),
            ));
            if (isCurrent && selStart === selEnd && norm.index > i && norm.index <= endIdx) {
              children.push(caretEl('caret-' + endIdx));
            }
            i = endIdx;
            continue;
          }

          const atom = slot.atoms[i];
          const isSelected = isCurrent && i >= selStart && i < selEnd;
          children.push(renderAtomWrapper(atom, slot.id, i, isSelected));
          if (isCurrent && selStart === selEnd && norm.index === i + 1) {
            children.push(caretEl('caret-' + (i + 1)));
          }
          i += 1;
        }

        const cls = 'dme-slot' +
          (slot.id === 'root' ? ' dme-slot-root' : '') +
          (isCurrent && focused ? ' dme-slot-active' : '') +
          (extraClass ? ' ' + extraClass : '');

        return h(
          'span',
          {
            key: slot.id,
            className: cls,
            'data-slot-id': slot.id,
            onMouseDown: (e) => handlers.onSlotContainerMouseDown(e, slot.id, slot.atoms.length),
          },
          ...children,
        );
      }

      function renderAtomWrapper(atom, slotId, idx, isSelected) {
        if (atom.type === 'group') {
          const gSlot = doc.slots.get(atom.bodySlotId);
          return h(
            'span',
            {
              key: atom.id,
              className: 'dme-atom' + (isSelected ? ' dme-atom-selected' : ''),
            },
            gSlot ? renderSlot(gSlot.id) : null,
          );
        }
        return h(
          'span',
          {
            key: atom.id,
            className: 'dme-atom' + (isSelected ? ' dme-atom-selected' : ''),
            onMouseDown: (e) => handlers.onAtomMouseDown(e, slotId, idx, idx + 1),
            onMouseEnter: (e) => handlers.onAtomMouseEnter(e, slotId, idx, idx + 1),
          },
          renderAtomInner(atom),
        );
      }

      function renderAtomInner(atom) {
        switch (atom.type) {
          case 'textchar':
            return h('span', { className: 'dme-text' }, atom.v);
          case 'text':
            return h(
              'span',
              {
                className: atom.unknown ? 'dme-unknown' : /[a-zA-Z]/.test(atom.v) ? 'dme-var' : 'dme-num',
              },
              atom.v,
            );
          case 'sym': {
            const isItalicSym = !atom.upright && (atom.italic === true || /^[α-ωϵϑϰϖϱςϕϝ]$/.test(atom.ch));
            return h('span', { className: isItalicSym ? 'dme-var' : 'dme-sym' }, atom.ch);
          }
          case 'func':
            return h('span', { className: 'dme-func' }, atom.name);
          case 'space':
            return h('span', { className: 'dme-vis-space', style: { width: atom.w.startsWith('-') ? '0.12em' : atom.w }, title: atom.label });
          case 'hspace':
            return h('span', { className: 'dme-vis-hspace' }, '↔', renderSlot(atom.bodySlotId));
          case 'atomic':
            return h('span', { className: 'dme-atomic' }, ...renderList(atom.previewNodes, atom.id));
          case 'frac':
            return h(
              'span',
              { className: 'dme-frac' },
              h('span', { className: 'dme-frac-num' }, renderSlot(atom.numSlotId)),
              h('span', { className: 'dme-frac-den' }, renderSlot(atom.denSlotId)),
            );
          case 'binom':
            return h(
              'span',
              { className: 'dme-delim-wrap' },
              DelimSvg('('),
              h(
                'span',
                { className: 'dme-binom' },
                h('span', { className: 'dme-binom-top' }, renderSlot(atom.topSlotId)),
                h('span', { className: 'dme-binom-bottom' }, renderSlot(atom.bottomSlotId)),
              ),
              DelimSvg(')'),
            );
          case 'sqrt':
            return h(
              'span',
              { className: 'dme-sqrt' },
              atom.indexSlotId ? h('span', { className: 'dme-sqrt-index' }, renderSlot(atom.indexSlotId)) : null,
              SurdSvg(),
              h('span', { className: 'dme-sqrt-body' }, renderSlot(atom.bodySlotId)),
            );
          case 'script':
            return h(
              'span',
              { className: 'dme-script' },
              atom.baseSlotId ? renderSlot(atom.baseSlotId) : atom.baseAtom ? renderAtomInner(atom.baseAtom) : null,
              h(
                'span',
                { className: 'dme-scripts' },
                atom.supSlotId ? h('span', { className: 'dme-sup' }, renderSlot(atom.supSlotId)) : null,
                atom.subSlotId ? h('span', { className: 'dme-sub' }, renderSlot(atom.subSlotId)) : null,
              ),
            );
          case 'bigop':
            if (atom.limits === 'side') {
              return h(
                'span',
                { className: 'dme-integral' },
                h('span', { className: 'dme-opchar' }, atom.ch),
                atom.supSlotId || atom.subSlotId ? h(
                  'span',
                  { className: 'dme-scripts dme-integral-scripts' },
                  atom.supSlotId ? h('span', { className: 'dme-sup' }, renderSlot(atom.supSlotId)) : null,
                  atom.subSlotId ? h('span', { className: 'dme-sub' }, renderSlot(atom.subSlotId)) : null,
                ) : null,
              );
            }
            return h(
              'span',
              { className: 'dme-bigop' },
              atom.supSlotId ? h('span', { className: 'dme-lim' }, renderSlot(atom.supSlotId)) : null,
              h('span', { className: 'dme-opchar' }, atom.ch),
              atom.subSlotId ? h('span', { className: 'dme-lim' }, renderSlot(atom.subSlotId)) : null,
            );
          case 'integral':
            if (atom.limits === 'stack') {
              return h(
                'span',
                { className: 'dme-bigop dme-integral-stack' },
                atom.supSlotId ? h('span', { className: 'dme-lim' }, renderSlot(atom.supSlotId)) : null,
                IntegralGlyph(atom.ch),
                atom.subSlotId ? h('span', { className: 'dme-lim' }, renderSlot(atom.subSlotId)) : null,
              );
            }
            return h(
              'span',
              { className: 'dme-integral' },
              IntegralGlyph(atom.ch),
              atom.supSlotId || atom.subSlotId ? h(
                'span',
                { className: 'dme-scripts dme-integral-scripts' },
                atom.supSlotId ? h('span', { className: 'dme-sup' }, renderSlot(atom.supSlotId)) : null,
                atom.subSlotId ? h('span', { className: 'dme-sub' }, renderSlot(atom.subSlotId)) : null,
              ) : null,
            );
          case 'mathop':
            if (atom.limits === 'side') {
              return h(
                'span',
                { className: 'dme-script' },
                renderSlot(atom.bodySlotId),
                atom.supSlotId || atom.subSlotId ? h(
                  'span',
                  { className: 'dme-scripts' },
                  atom.supSlotId ? h('span', { className: 'dme-sup' }, renderSlot(atom.supSlotId)) : null,
                  atom.subSlotId ? h('span', { className: 'dme-sub' }, renderSlot(atom.subSlotId)) : null,
                ) : null,
              );
            }
            return h(
              'span',
              { className: 'dme-bigop' },
              atom.supSlotId ? h('span', { className: 'dme-lim' }, renderSlot(atom.supSlotId)) : null,
              renderSlot(atom.bodySlotId),
              atom.subSlotId ? h('span', { className: 'dme-lim' }, renderSlot(atom.subSlotId)) : null,
            );
          case 'delim':
            return h(
              'span',
              { className: 'dme-delim-wrap' },
              atom.left !== '' ? DelimSvg(atom.left) : null,
              h('span', { className: 'dme-delim-body' }, renderSlot(atom.bodySlotId)),
              atom.midSlotId ? DelimSvg('∣', 'dme-delim-mid') : null,
              atom.midSlotId ? h('span', { className: 'dme-delim-body' }, renderSlot(atom.midSlotId)) : null,
              atom.right !== '' ? DelimSvg(atom.right) : null,
            );
          case 'matrix': {
            const delimiters = ENV_DELIMITERS[atom.env] || ['', ''];
            const table = h(
              'table',
              { className: 'dme-matrix' },
              h(
                'tbody',
                null,
                atom.rowSlotIds.map((rIds, rIdx) =>
                  h(
                    'tr',
                    { key: rIdx },
                    rIds.map((cId, cIdx) =>
                      h(
                        'td',
                        {
                          key: cIdx,
                          className: atom.env === 'cases' || atom.env === 'aligned' || atom.alignment[cIdx] === 'l'
                            ? 'dme-align-left' : atom.alignment[cIdx] === 'r' ? 'dme-align-right' : undefined,
                          onMouseDown: (e) => handlers.onSlotMouseDown(e, cId, doc.slots.get(cId)?.atoms.length || 0),
                        },
                        renderSlot(cId),
                      ),
                    ),
                  ),
                ),
              ),
            );
            return h(
              'span',
              { className: 'dme-matrix-wrap' },
              delimiters[0] !== '' ? DelimSvg(delimiters[0], 'dme-delim-big') : null,
              table,
              delimiters[1] !== '' ? DelimSvg(delimiters[1], 'dme-delim-big') : null,
            );
          }
          case 'xarrow':
            return h(
              'span',
              { className: 'dme-xarrow' },
              h('span', { className: 'dme-xarrow-label' }, renderSlot(atom.aboveSlotId)),
              XArrowMarkSvg(atom.ch),
              atom.belowSlotId ? h('span', { className: 'dme-xarrow-label' }, renderSlot(atom.belowSlotId)) : null,
            );
          case 'stack': {
            const topS = doc.slots.get(atom.topSlotId);
            const baseS = doc.slots.get(atom.baseSlotId);
            return h(
              'span',
              { className: atom.position === 'under' ? 'dme-stack dme-stack-under' : 'dme-stack' },
              h('span', { className: 'dme-stack-top' }, topS?.readOnly ? renderList(parseLatex(doc.source.slice(topS.contentStart, topS.contentEnd)), atom.id + 't') : renderSlot(atom.topSlotId)),
              h('span', { className: 'dme-stack-base' }, baseS?.readOnly ? renderList(parseLatex(doc.source.slice(baseS.contentStart, baseS.contentEnd)), atom.id + 'b') : renderSlot(atom.baseSlotId)),
            );
          }
          case 'not':
            return h('span', { className: 'dme-not' }, renderSlot(atom.bodySlotId));
          case 'decoration':
            return h(
              'span',
              {
                className: 'dme-decoration dme-decoration-' + atom.decoration,
                style: atom.decoration === 'colorbox' ? { backgroundColor: atom.color } : undefined,
              },
              renderSlot(atom.bodySlotId),
            );
          case 'accent': {
            const hasLabel = atom.supSlotId || atom.subSlotId;
            const accentCore = h(
              'span',
              { className: (atom.below ? 'dme-accent dme-accent-below' : 'dme-accent') + (atom.wide ? ' dme-accent-wide' : '') },
              h('span', { className: 'dme-accent-body' }, renderSlot(atom.bodySlotId)),
              WideAccentSvg(atom.mark, Boolean(atom.below), Boolean(atom.wide)),
            );
            if (!hasLabel) return accentCore;
            return h(
              'span',
              { className: 'dme-overunder-wrap' },
              atom.supSlotId ? h('span', { className: 'dme-overunder-label' }, renderSlot(atom.supSlotId)) : null,
              accentCore,
              atom.subSlotId ? h('span', { className: 'dme-overunder-label' }, renderSlot(atom.subSlotId)) : null,
            );
          }
          case 'line':
            return h(
              'span',
              { className: atom.position === 'top' ? 'dme-line-top' : 'dme-line-bottom' },
              renderSlot(atom.bodySlotId),
            );
          case 'longdiv':
            return h(
              'span',
              { className: 'dme-longdiv' },
              LongDivCurveSvg(),
              h('span', { className: 'dme-line-top dme-longdiv-body' }, renderSlot(atom.bodySlotId)),
            );
          case 'brace':
            return h(
              'span',
              { className: 'dme-brace-wrap ' + (atom.position === 'top' ? 'dme-brace-top' : 'dme-brace-bottom') },
              atom.position === 'top' && atom.supSlotId ? h('span', { className: 'dme-overunder-label' }, renderSlot(atom.supSlotId)) : null,
              atom.position === 'top' ? BraceSvg('top') : null,
              h('span', { className: 'dme-brace-body' }, renderSlot(atom.bodySlotId)),
              atom.position === 'bottom' ? BraceSvg('bottom') : null,
              atom.position === 'bottom' && atom.subSlotId ? h('span', { className: 'dme-overunder-label' }, renderSlot(atom.subSlotId)) : null,
            );
          case 'phantom':
            return h('span', { className: 'dme-vis-phantom', title: '\\' + atom.mode }, renderSlot(atom.bodySlotId));
          case 'font':
            return h('span', { className: 'dme-font dme-font-' + atom.font }, renderSlot(atom.bodySlotId));
          case 'operatorname':
            return h('span', { className: 'dme-func' }, renderSlot(atom.bodySlotId));
          case 'textstyle':
            return h('span', { className: 'dme-text' }, renderSlot(atom.bodySlotId));
          default:
            return null;
        }
      }

      return h('span', { className: 'dme-math' }, renderSlot('root'));
    }

    function VisualEditor({ text, onCtrlEnter }) {
      const boxRef = React.useRef(null);
      const sinkRef = React.useRef(null);
      const isComposingRef = React.useRef(false);
      const dragSlotRef = React.useRef(null);
      const cmdStateRef = React.useRef({ text: null, index: 0, justSteppedByBrace: false, explicitFontSlotId: null });
      const [cmdState, setCmdStateReact] = React.useState(cmdStateRef.current);
      const [imeText, setImeText] = React.useState('');

      const syncCmdState = (next) => {
        const normalized = {
          text: next.text ?? null,
          index: next.index ?? 0,
          justSteppedByBrace: Boolean(next.justSteppedByBrace),
          explicitFontSlotId: next.explicitFontSlotId ?? null,
        };
        cmdStateRef.current = normalized;
        setCmdStateReact(normalized);
      };
      const clearCmdState = () => {
        if (cmdStateRef.current.text !== null || cmdStateRef.current.justSteppedByBrace || cmdStateRef.current.explicitFontSlotId !== null) {
          syncCmdState({ text: null, index: 0, justSteppedByBrace: false, explicitFontSlotId: null });
        }
      };
      const cmdText = cmdState.text;
      const cmdIndex = cmdState.index;

      const focusSink = () => {
        if (sinkRef.current) {
          sinkRef.current.focus({ preventScroll: true });
        }
      };

      React.useEffect(() => {
        store.visualSink = sinkRef.current;
        let raf = null;
        let timer1 = null;
        let timer2 = null;
        if (sinkRef.current && store.activeEditor === 'visual') {
          sinkRef.current.focus({ preventScroll: true });
          if (typeof requestAnimationFrame === 'function') {
            raf = requestAnimationFrame(() => {
              if (sinkRef.current && store.open && store.activeEditor === 'visual') {
                sinkRef.current.focus({ preventScroll: true });
              }
            });
          }
          timer1 = setTimeout(() => {
            if (sinkRef.current && store.open && store.activeEditor === 'visual') {
              sinkRef.current.focus({ preventScroll: true });
            }
          }, 25);
          timer2 = setTimeout(() => {
            if (sinkRef.current && store.open && store.activeEditor === 'visual') {
              sinkRef.current.focus({ preventScroll: true });
            }
          }, 80);
        }
        return () => {
          if (raf !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
          if (timer1 !== null) clearTimeout(timer1);
          if (timer2 !== null) clearTimeout(timer2);
          if (store.visualSink === sinkRef.current) store.visualSink = null;
        };
      }, []);

      // Keep the invisible textarea anchored right at the active caret so OS IME popups
      // appear directly beneath the formula cursor rather than offscreen.
      React.useEffect(() => {
        const box = boxRef.current;
        const sink = sinkRef.current;
        if (!box || !sink || typeof box.querySelector !== 'function' || typeof box.getBoundingClientRect !== 'function') {
          return;
        }
        const caret = box.querySelector('.dme-caret');
        if (caret && typeof caret.getBoundingClientRect === 'function') {
          const boxRect = box.getBoundingClientRect();
          const caretRect = caret.getBoundingClientRect();
          const left = Math.max(4, caretRect.left - boxRect.left + (box.scrollLeft || 0));
          const top = Math.max(4, caretRect.top - boxRect.top + (box.scrollTop || 0));
          sink.style.left = left + 'px';
          sink.style.top = top + 'px';
        }
      });

      React.useEffect(() => {
        const stopDrag = () => { dragSlotRef.current = null; };
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
          window.addEventListener('mouseup', stopDrag);
          return () => window.removeEventListener('mouseup', stopDrag);
        }
        return undefined;
      }, []);

      const doc = React.useMemo(() => parseVisual(store.latex), [store.latex]);
      const suggestions = React.useMemo(() => (cmdText === null ? [] : matchCommands(cmdText)), [cmdText]);

      const commitCommand = (chosenCmd) => {
        const curCmd = cmdStateRef.current;
        const curSuggestions = curCmd.text === null ? [] : matchCommands(curCmd.text);
        const name = chosenCmd !== undefined ? chosenCmd : (curSuggestions[curCmd.index]?.cmd || curCmd.text || '');
        const trimmed = name.trim();
        if (trimmed === '') {
          clearCmdState();
          return null;
        }
        const res = visualExecuteCommand(store.latex, store.visualCursor, trimmed, { charItalic: store.charItalic });
        const nextExplicitFontSlotId = ['mathrm', 'mathit', 'mathbf', 'mathsf', 'mathtt'].includes(trimmed)
          ? res.cursor.slotId
          : null;
        syncCmdState({ text: null, index: 0, justSteppedByBrace: false, explicitFontSlotId: nextExplicitFontSlotId });
        store.commitVisual(res.latex, res.cursor);
        return res;
      };

      const handleRawChars = (raw) => {
        if (!raw) return;
        const out = visualProcessInput(store.latex, store.visualCursor, cmdStateRef.current, raw, { charItalic: store.charItalic });
        syncCmdState(out.cmdState);
        if (out.latex !== store.latex ||
            out.cursor.slotId !== store.visualCursor.slotId ||
            out.cursor.index !== store.visualCursor.index ||
            out.cursor.anchor !== store.visualCursor.anchor) {
          store.commitVisual(out.latex, out.cursor);
        }
      };
      store.visualType = handleRawChars;
      store.clearVisualCmdState = clearCmdState;

      const onSinkKeyDown = (event) => {
        if (isComposingRef.current || (event.nativeEvent && event.nativeEvent.isComposing) || event.keyCode === 229) {
          return;
        }
        const curCmd = cmdStateRef.current;

        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          if (curCmd.text !== null) commitCommand();
          onCtrlEnter();
          return;
        }

        // Command-mode keyboard navigation
        if (curCmd.text !== null) {
          const curSuggestions = matchCommands(curCmd.text);
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            clearCmdState();
            return;
          }
          if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            event.stopPropagation();
            commitCommand();
            return;
          }
          if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
            event.preventDefault();
            if (curSuggestions.length > 0) {
              syncCmdState({ ...curCmd, index: (curCmd.index + 1) % curSuggestions.length });
            }
            return;
          }
          if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            event.preventDefault();
            if (curSuggestions.length > 0) {
              syncCmdState({ ...curCmd, index: (curCmd.index - 1 + curSuggestions.length) % curSuggestions.length });
            }
            return;
          }
          if (event.key === 'Backspace') {
            event.preventDefault();
            if (curCmd.text.length === 0) {
              clearCmdState();
            } else {
              syncCmdState({ text: curCmd.text.slice(0, -1), index: 0, justSteppedByBrace: false });
            }
            return;
          }
        }
        if (curCmd.justSteppedByBrace && !['Shift', 'Control', 'Alt', 'Meta'].includes(event.key) && event.key !== '{') {
          cmdStateRef.current = { ...curCmd, justSteppedByBrace: false };
        }

        // Undo / Redo / Select All / Fraction shortcut (Ctrl+/ or Alt+/)
        if (event.ctrlKey || event.metaKey) {
          const lower = event.key.toLowerCase();
          if (lower === 'z' && !event.shiftKey) {
            event.preventDefault();
            store.undoVisual();
            return;
          }
          if (lower === 'y' || (lower === 'z' && event.shiftKey)) {
            event.preventDefault();
            store.redoVisual();
            return;
          }
          if (lower === 'a') {
            event.preventDefault();
            const norm = normalizeVisualCursor(doc, store.visualCursor);
            const curSlot = doc.slots.get(norm.slotId);
            const rootSlot = doc.slots.get('root');
            if (curSlot && curSlot.atoms.length > 0 && !(norm.anchor === 0 && norm.index === curSlot.atoms.length)) {
              store.set({ visualCursor: { slotId: curSlot.id, index: curSlot.atoms.length, anchor: 0 } });
            } else if (rootSlot && rootSlot.atoms.length > 0) {
              store.set({ visualCursor: { slotId: 'root', index: rootSlot.atoms.length, anchor: 0 } });
            }
            return;
          }
          if (event.key === '/') {
            event.preventDefault();
            const res = visualInsertItem(store.latex, store.visualCursor, { kind: 'template', latex: '\\frac{@}{}' });
            store.commitVisual(res.latex, res.cursor);
            return;
          }
        }

        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          clearCmdState();
          store.set({ visualCursor: visualMoveHorizontal(doc, store.visualCursor, -1, event.shiftKey) });
          return;
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          clearCmdState();
          store.set({ visualCursor: visualMoveHorizontal(doc, store.visualCursor, 1, event.shiftKey) });
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          clearCmdState();
          store.set({ visualCursor: visualMoveVertical(doc, store.visualCursor, -1) });
          return;
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          clearCmdState();
          store.set({ visualCursor: visualMoveVertical(doc, store.visualCursor, 1) });
          return;
        }
        if (event.key === 'Tab') {
          event.preventDefault();
          clearCmdState();
          store.set({ visualCursor: visualMoveTab(doc, store.visualCursor, event.shiftKey) });
          return;
        }
        if (event.key === 'Home') {
          event.preventDefault();
          clearCmdState();
          const norm = normalizeVisualCursor(doc, store.visualCursor);
          store.set({
            visualCursor: {
              slotId: norm.slotId,
              index: 0,
              anchor: event.shiftKey ? (norm.anchor ?? norm.index) : null,
            },
          });
          return;
        }
        if (event.key === 'End') {
          event.preventDefault();
          clearCmdState();
          const norm = normalizeVisualCursor(doc, store.visualCursor);
          const s = doc.slots.get(norm.slotId);
          const len = s ? s.atoms.length : 0;
          store.set({
            visualCursor: {
              slotId: norm.slotId,
              index: len,
              anchor: event.shiftKey ? (norm.anchor ?? norm.index) : null,
            },
          });
          return;
        }
        if (event.key === 'Backspace') {
          event.preventDefault();
          const res = visualDeleteBackward(store.latex, store.visualCursor);
          store.commitVisual(res.latex, res.cursor);
          return;
        }
        if (event.key === 'Delete') {
          event.preventDefault();
          const res = visualDeleteForward(store.latex, store.visualCursor);
          store.commitVisual(res.latex, res.cursor);
          return;
        }
        if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          // Inside a matrix/cases environment, Enter moves down to the next row or jumps to next cell
          const norm = normalizeVisualCursor(doc, store.visualCursor);
          const s = doc.slots.get(norm.slotId);
          if (s && s.isMatrixCell) {
            store.set({ visualCursor: visualMoveTab(doc, store.visualCursor, false) });
          }
        }
      };

      const handlers = {
        onSlotMouseDown(e, slotId, idx) {
          e.preventDefault();
          e.stopPropagation();
          clearCmdState();
          dragSlotRef.current = slotId;
          store.set({
            activeEditor: 'visual',
            visualCursor: { slotId, index: idx, anchor: null },
          });
          focusSink();
        },
        onSlotContainerMouseDown(e, slotId, endIdx) {
          e.preventDefault();
          e.stopPropagation();
          clearCmdState();
          const rect = e.currentTarget.getBoundingClientRect();
          const idx = e.clientX < rect.left + 8 ? 0 : endIdx;
          dragSlotRef.current = slotId;
          store.set({
            activeEditor: 'visual',
            visualCursor: { slotId, index: idx, anchor: null },
          });
          focusSink();
        },
        onAtomMouseDown(e, slotId, startIdx, endIdx) {
          e.preventDefault();
          e.stopPropagation();
          clearCmdState();
          const rect = e.currentTarget.getBoundingClientRect();
          const placeAfter = e.clientX >= (rect.left + rect.right) / 2;
          const nextIdx = placeAfter ? endIdx : startIdx;
          const norm = normalizeVisualCursor(doc, store.visualCursor);
          const anchor = e.shiftKey && norm.slotId === slotId ? (norm.anchor ?? norm.index) : null;
          dragSlotRef.current = slotId;
          store.set({
            activeEditor: 'visual',
            visualCursor: { slotId, index: nextIdx, anchor: anchor === nextIdx ? null : anchor },
          });
          focusSink();
        },
        onAtomMouseEnter(e, slotId, startIdx, endIdx) {
          if (dragSlotRef.current !== slotId || e.buttons !== 1) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const placeAfter = e.clientX >= (rect.left + rect.right) / 2;
          const nextIdx = placeAfter ? endIdx : startIdx;
          const norm = normalizeVisualCursor(doc, store.visualCursor);
          if (norm.slotId !== slotId) return;
          const anchor = norm.anchor ?? norm.index;
          store.set({
            visualCursor: { slotId, index: nextIdx, anchor: anchor === nextIdx ? null : anchor },
          });
        },
      };

      const isFocused = store.activeEditor === 'visual' && store.visualFocused;
      const isEmpty = store.latex.trim() === '';

      return h(
        React.Fragment,
        null,
        h(
          'div',
          {
            ref: boxRef,
            className: 'dme-visual' + (isFocused ? ' is-focused' : ''),
            role: 'group',
            tabIndex: -1,
            'aria-label': text.visualLabel,
            onFocus: (e) => {
              if (e.target === e.currentTarget) focusSink();
            },
            onClick: (e) => {
              if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
              if (store.activeEditor !== 'visual') store.set({ activeEditor: 'visual' });
              focusSink();
            },
            onMouseDown: (e) => {
              if (e.target === sinkRef.current) return;
              e.preventDefault();
              e.stopPropagation();
              clearCmdState();
              const root = doc.slots.get('root');
              store.set({
                activeEditor: 'visual',
                visualCursor: { slotId: 'root', index: root ? root.atoms.length : 0, anchor: null },
              });
              focusSink();
            },
          },
          h('textarea', {
            ref: sinkRef,
            className: 'dme-visual-sink',
            defaultValue: '',
            rows: 1,
            'aria-label': text.visualLabel,
            tabIndex: 0,
            spellCheck: false,
            autoComplete: 'off',
            autoCorrect: 'off',
            autoCapitalize: 'off',
            onFocus: () => store.set({ activeEditor: 'visual', visualFocused: true }),
            onBlur: () => {
              isComposingRef.current = false;
              setImeText('');
              store.set({ visualFocused: false });
            },
            onCompositionStart: () => {
              isComposingRef.current = true;
              setImeText('');
            },
            onCompositionUpdate: (e) => {
              isComposingRef.current = true;
              setImeText(e.data || (sinkRef.current ? sinkRef.current.value : ''));
            },
            onCompositionEnd: (e) => {
              isComposingRef.current = false;
              setImeText('');
              const el = e.currentTarget || sinkRef.current;
              const composed = (el ? el.value : '') || e.data || '';
              if (el) el.value = '';
              if (composed) handleRawChars(composed);
            },
            onInput: (e) => {
              const native = e.nativeEvent;
              const el = e.currentTarget || sinkRef.current;
              if (isComposingRef.current || (native && native.isComposing)) {
                setImeText(el ? el.value : '');
                return;
              }
              const val = el ? el.value : '';
              if (val) {
                el.value = '';
                handleRawChars(val);
              }
            },
            onKeyDown: onSinkKeyDown,
            onCopy: (e) => {
              const sel = getSelectedVisualLatex(doc, store.visualCursor) || store.latex;
              if (sel && e.clipboardData) {
                e.preventDefault();
                e.clipboardData.setData('text/plain', sel);
              }
            },
            onCut: (e) => {
              const sel = getSelectedVisualLatex(doc, store.visualCursor);
              if (sel && e.clipboardData) {
                e.preventDefault();
                e.clipboardData.setData('text/plain', sel);
                const res = visualDeleteBackward(store.latex, store.visualCursor);
                store.commitVisual(res.latex, res.cursor);
              }
            },
            onPaste: (e) => {
              if (!e.clipboardData) return;
              const pasted = e.clipboardData.getData('text/plain');
              if (!pasted) return;
              e.preventDefault();
              // If pasted string contains LaTeX commands/braces, insert as LaTeX snippet directly!
              if (/[\\{}^_]/.test(pasted)) {
                const norm = normalizeVisualCursor(doc, store.visualCursor);
                const [s, end] = selectedBounds(norm);
                const res = editSlotRange(doc, norm.slotId, s, end, compatibleLatex(pasted));
                store.commitVisual(res.latex, res.cursor);
              } else {
                const res = visualInsertText(store.latex, store.visualCursor, pasted, { charItalic: store.charItalic });
                store.commitVisual(res.latex, res.cursor);
              }
            },
          }),
          isEmpty && !isFocused && cmdText === null && !imeText
            ? h('span', { className: 'dme-preview-empty' }, text.empty)
            : renderVisualDoc(doc, store.visualCursor, isFocused, cmdText, handlers, imeText),
        ),
        cmdText !== null && suggestions.length > 0 ? h(
          'div',
          { className: 'dme-cmd-menu', role: 'listbox' },
          ...suggestions.map((entry, i) =>
            h(
              'button',
              {
                key: entry.cmd,
                type: 'button',
                className: 'dme-cmd-item' + (i === cmdIndex ? ' is-selected' : ''),
                onMouseDown: (e) => {
                  e.preventDefault();
                  commitCommand(entry.cmd);
                  focusSink();
                },
              },
              entry.label,
            ),
          ),
        ) : null,
      );
    }

    function TabStrip({ text }) {
      return h(
        'div',
        { className: 'dme-tabs', role: 'tablist' },
        ...CATEGORIES.map((category) =>
          h(
            'button',
            {
              key: category.id,
              type: 'button',
              role: 'tab',
              className: 'dme-tab',
              'aria-selected': store.tab === category.id ? 'true' : 'false',
              onMouseDown: (e) => e.preventDefault(),
              onClick: () => store.set({ tab: category.id, matrixConfig: null }),
            },
            store.lang === 'en' ? category.en : category.zh,
          ),
        ),
      );
    }

    function Panel({ inputActions }) {
      useStore();
      const text = strings();
      const [status, setStatus] = React.useState({ message: '', tone: '' });
      const panelRef = React.useRef(null);
      const textareaRef = React.useRef(null);
      const statusTimer = React.useRef(null);

      React.useEffect(() => {
        store.textarea = textareaRef.current;
        return () => {
          if (store.textarea === textareaRef.current) store.textarea = null;
        };
      });

      React.useEffect(() => {
        if (!store.open) return;
        const el = panelRef.current;
        if (!el || typeof el.scrollIntoView !== 'function' || typeof el.getBoundingClientRect !== 'function') return;
        const scroller = typeof el.closest === 'function' ? el.closest('[data-conversation-scroll]') : null;
        if (scroller && typeof scroller.getBoundingClientRect === 'function') {
          const panelRect = el.getBoundingClientRect();
          const scrollerRect = scroller.getBoundingClientRect();
          if (panelRect.top < scrollerRect.top + 4 || panelRect.bottom > scrollerRect.bottom - 4) {
            el.scrollIntoView({ block: 'nearest' });
          }
        }
      }, [store.open]);

      React.useEffect(() => () => {
        if (statusTimer.current !== null) clearTimeout(statusTimer.current);
      }, []);

      const flash = (message, tone) => {
        setStatus({ message, tone });
        if (statusTimer.current !== null) clearTimeout(statusTimer.current);
        statusTimer.current = setTimeout(() => setStatus({ message: '', tone: '' }), 2600);
      };

      // Hooks must stay unconditional: this component renders null while the
      // panel is closed, so every hook has to run before that early return.
      const category = TAB.get(store.tab) || TAB.get('greek');

      // The grid is rebuilt only when the category or language changes, so
      // typing in the formula box does not re-parse ~50 previews per keystroke.
      const isExpanded = Boolean(store.expanded[category.id]);
      const grid = React.useMemo(() => {
        const items = isExpanded && category.expandedItems ? category.expandedItems : category.items;
        return items.map((item, index) => h(CellButton, { key: category.id + '-' + index, item, text }));
      }, [category.id, store.lang, isExpanded]);

      if (!store.open) return null;

      const doInsert = () => {
        const result = insertIntoComposer(inputActions);
        if (result === 'ok') flash(text.inserted, 'ok');
        else if (result === 'empty') flash(text.empty, '');
        else flash(text.failed, 'error');
      };

      const doCopy = () => {
        const value = store.latex.trim();
        if (value === '') return;
        if (navigator.clipboard !== undefined && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(value).then(
            () => flash(text.copied, 'ok'),
            () => flash(text.copyFailed, 'error'),
          );
        } else {
          flash(text.copyFailed, 'error');
        }
      };

      const updateMatrixConfig = (patch) => {
        if (store.matrixConfig !== null) store.set({ matrixConfig: { ...store.matrixConfig, ...patch } });
      };

      const createMatrix = () => {
        const config = store.matrixConfig;
        if (config === null) return;
        const rows = Number(config.rows);
        const columns = Number(config.columns);
        if (![rows, columns].every((value) => Number.isInteger(value) && value >= 1 && value <= 99)) {
          flash(text.matrixInvalid, 'error');
          return;
        }
        insertIntoSnippet(matrixTemplate(config.item.environment, rows, columns, config.item.name, config.alignment));
        store.set({ matrixConfig: null });
      };

      const onKeyDown = (event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          if (store.matrixConfig !== null) store.set({ matrixConfig: null });
          else store.set({ open: false, visualFocused: false });
          return;
        }
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          doInsert();
          return;
        }
        const tag = event.target && event.target.tagName;
        if (tag && !['TEXTAREA', 'INPUT', 'SELECT'].includes(tag) && !event.ctrlKey && !event.metaKey && !event.altKey) {
          if (event.key.length === 1 && !(tag === 'BUTTON' && event.key === ' ')) {
            event.preventDefault();
            store.set({ activeEditor: 'visual' });
            if (store.visualSink) store.visualSink.focus({ preventScroll: true });
            if (store.visualType) store.visualType(event.key);
            return;
          }
          if (event.key === 'Backspace') {
            event.preventDefault();
            store.set({ activeEditor: 'visual' });
            if (store.visualSink) store.visualSink.focus({ preventScroll: true });
            const res = visualDeleteBackward(store.latex, store.visualCursor);
            store.commitVisual(res.latex, res.cursor);
          }
        }
      };

      const syncCursorFromTextarea = (target) => {
        if (!target) return;
        const pos = typeof target.selectionStart === 'number' ? target.selectionStart : store.latex.length;
        const nextDoc = parseVisual(target.value);
        store.set({
          activeEditor: 'latex',
          visualCursor: offsetToVisualCursor(nextDoc, pos),
        });
      };

      return h(
        'div',
        {
          ref: panelRef,
          className: 'dme-panel',
          role: 'region',
          'aria-label': text.title,
          onKeyDown,
          onClick: (e) => {
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
          },
        },
        h(Style),
        h(
          'div',
          { className: 'dme-head' },
          h('span', { className: 'dme-logo' }, '√'),
          h('span', { className: 'dme-title' }, text.title),
          h('span', { className: 'dme-hint' }, text.hint),
          h(
            'div',
            { className: 'dme-head-right' },
            h(
              'div',
              { className: 'dme-seg', role: 'group', 'aria-label': text.insert },
              ['inline', 'block', 'raw'].map((mode) =>
                h(
                  'button',
                  {
                    key: mode,
                    type: 'button',
                    'aria-pressed': store.mode === mode ? 'true' : 'false',
                    onMouseDown: (e) => e.preventDefault(),
                    onClick: () => store.set({ mode }),
                  },
                  text[mode],
                ),
              ),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dme-close',
                'aria-label': text.close,
                title: text.close,
                onClick: () => store.set({ open: false, visualFocused: false }),
              },
              '×',
            ),
          ),
        ),
        h(TabStrip, { text }),
        h(
          'div',
          { className: 'dme-body' },
          h(
            'div',
            { className: 'dme-catalog', role: 'tabpanel', 'aria-label': store.lang === 'en' ? category.en : category.zh },
            h('div', { key: category.id + '-' + (isExpanded ? 'expanded' : 'pinned'),
              className: 'dme-grid dme-grid-' + category.id + (category.id === 'greek' && !store.charItalic ? ' is-upright' : '') }, grid),
            category.expandedItems ? h('button', {
              type: 'button', className: 'dme-btn dme-catalog-toggle',
              'aria-expanded': isExpanded ? 'true' : 'false',
              onMouseDown: (e) => e.preventDefault(),
              onClick: () => store.set({ expanded: { ...store.expanded, [category.id]: !isExpanded } }),
            }, isExpanded ? text.less : text.more) : null,
          ),
          h(
            'div',
            { className: 'dme-side' },
            store.matrixConfig === null ? null : h(
              'div',
              { className: 'dme-matrix-config', role: 'group', 'aria-label': text.matrixConfig },
              h('span', { className: 'dme-matrix-config-title' }, text.matrixConfig),
              store.matrixConfig.item.rowInput ? h('label', null, text.matrixRows,
                h('input', { type: 'number', min: 1, max: 99, step: 1, value: store.matrixConfig.rows,
                  onChange: (event) => updateMatrixConfig({ rows: event.target.value }) })) : null,
              store.matrixConfig.item.columnInput ? h('label', null, text.matrixColumns,
                h('input', { type: 'number', min: 1, max: 99, step: 1, value: store.matrixConfig.columns,
                  onChange: (event) => updateMatrixConfig({ columns: event.target.value }) })) : null,
              h('label', null, text.matrixAlignment,
                h('select', { value: store.matrixConfig.alignment,
                  onChange: (event) => updateMatrixConfig({ alignment: event.target.value }) },
                h('option', { value: 'l' }, text.alignLeft),
                h('option', { value: 'c' }, text.alignCenter),
                h('option', { value: 'r' }, text.alignRight))),
              h('button', { type: 'button', className: 'dme-btn dme-btn-primary', onClick: createMatrix }, text.matrixCreate),
              h('button', { type: 'button', className: 'dme-btn', onClick: () => store.set({ matrixConfig: null }) }, text.cancel),
            ),
            h(
              'div',
              { className: 'dme-editor-label' },
              h('span', { className: 'dme-editor-label-text' }, text.visualLabel),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dme-slant-toggle' + (store.charItalic ? '' : ' is-upright'),
                  'aria-pressed': store.charItalic ? 'true' : 'false',
                  title: text.slantHint,
                  onMouseDown: (e) => e.preventDefault(),
                  onClick: () => {
                    const nextItalic = !store.charItalic;
                    if (store.clearVisualCmdState) store.clearVisualCmdState();
                    const converted = visualApplySlant(store.latex, store.visualCursor, nextItalic);
                    if (converted.latex !== store.latex) {
                      store.charItalic = nextItalic;
                      store.activeEditor = 'visual';
                      store.commitVisual(converted.latex, converted.cursor);
                    } else {
                      store.set({ charItalic: nextItalic, activeEditor: 'visual' });
                    }
                    if (store.visualSink) store.visualSink.focus({ preventScroll: true });
                  },
                },
                store.charItalic ? text.italicOn : text.italicOff,
              ),
            ),
            h(VisualEditor, { text, onCtrlEnter: doInsert }),
            h('div', { className: 'dme-editor-label' }, text.latexLabel),
            h('textarea', {
              ref: textareaRef,
              className: 'dme-input',
              value: store.latex,
              placeholder: text.placeholder,
              spellCheck: false,
              onFocus: (event) => syncCursorFromTextarea(event.target),
              onClick: (event) => syncCursorFromTextarea(event.target),
              onChange: (event) => {
                const val = event.target.value;
                const pos = typeof event.target.selectionStart === 'number' ? event.target.selectionStart : val.length;
                const nextDoc = parseVisual(val);
                store.commitVisual(val, offsetToVisualCursor(nextDoc, pos));
                store.set({ activeEditor: 'latex' });
              },
              onKeyDown,
            }),
            h(
              'div',
              { className: 'dme-foot' },
              h('span', { className: 'dme-status', 'data-tone': status.tone }, status.message),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dme-btn',
                  onMouseDown: (e) => e.preventDefault(),
                  onClick: doCopy,
                },
                text.copy,
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dme-btn',
                  onMouseDown: (e) => e.preventDefault(),
                  onClick: () => {
                    store.set({ activeEditor: 'visual' });
                    store.commitVisual('', { slotId: 'root', index: 0, anchor: null });
                    if (store.visualSink) store.visualSink.focus({ preventScroll: true });
                  },
                },
                text.clear,
              ),
              h(
                'button',
                { type: 'button', className: 'dme-btn dme-btn-primary', onClick: doInsert },
                text.insert,
              ),
            ),
          ),
        ),
      );
    }

    /* A crash inside the panel would otherwise make the slot owner abdicate
     * this entry, which looks exactly like "the button does nothing". Catching
     * it here keeps the entry mounted and puts the failure on screen. */
    class PanelBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }

      static getDerivedStateFromError(error) {
        return { error };
      }

      render() {
        if (this.state.error !== null) {
          const message = this.state.error && this.state.error.message
            ? this.state.error.message
            : String(this.state.error);
          return h(
            'div',
            { className: 'dme-panel dme-panel-error', role: 'alert' },
            h('div', { className: 'dme-error-title' }, '数学公式编辑器渲染失败 / Math editor failed to render'),
            h('div', { className: 'dme-error-body' }, message),
          );
        }
        return this.props.children;
      }
    }

    function PanelEntry(props) {
      return h(PanelBoundary, null, h(Panel, props));
    }

    /* =======================================================================
     * 5. apply()
     * ===================================================================== */

    /** Pick the UI language from the host locale service, if it is present. */
    function languageOf(snapshot) {
      const raw = snapshot === undefined || snapshot === null
        ? ''
        : String(snapshot.id || snapshot.locale || snapshot.language || snapshot.tag || '');
      return /^zh/i.test(raw) ? 'zh' : raw === '' ? 'zh' : 'en';
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        const locale = ctx.get('locale');
        if (locale !== undefined && locale !== null && typeof locale.getLocale === 'function') {
          store.set({ lang: languageOf(locale.getLocale()) });
          if (typeof locale.subscribe === 'function') {
            ctx.effect(() => locale.subscribe(() => store.set({ lang: languageOf(locale.getLocale()) })));
          }
        }

        ctx.slots.inject('conversation.input.left', () =>
          ctx.slots.register(
            { name: 'conversation.input.left', id: 'math-editor-launcher', order: 30 },
            Launcher,
          ),
        );

        ctx.slots.inject('conversation.input.dock', () =>
          ctx.slots.register(
            { name: 'conversation.input.dock', id: 'math-editor-panel', order: 30 },
            PanelEntry,
          ),
        );
      },
    };
  },
});
