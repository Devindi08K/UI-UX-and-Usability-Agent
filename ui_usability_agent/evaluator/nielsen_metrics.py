"""
evaluator/nielsen_metrics.py
============================
Static-HTML proxy metrics for Nielsen's 10 Usability Heuristics (1994).
See EVALUATION_RATIONALE.md for per-function justification and references.

Heuristics covered
------------------
H1  system_status_score
H3  user_control_score
H4  button_consistency_score
H5  error_prevention_score
H6  recognition_score          (added — was missing from original)
H8  minimalist_design_score
H9  error_message_score
H10 help_documentation_score   (added — was missing from original)

Sub-metric functions return int in [0, 4]. Only compute_nielsen_score()
parses raw HTML.
"""

from bs4 import BeautifulSoup


def system_status_score(soup: BeautifulSoup) -> int:
    """
    H1 — Visibility of system status.

    Detects three status signals (sum, capped at 4):
      +2  <progress> element
      +1  aria-current attribute
      +1  .active / .current / .selected class

    <progress> scores +2 because it represents an explicit, quantified
    status indicator — a stronger design commitment than a CSS class.

    Ref: Nielsen (1994) H1; WCAG 2.2 SC 4.1.3; WAI-ARIA 1.2 aria-current
    """
    score = 0

    if soup.find('progress'):
        score += 2

    if soup.find(attrs={'aria-current': True}):
        score += 1

    state_words = {'active', 'current', 'selected', 'is-active', 'is-selected'}
    for el in soup.find_all(attrs={'class': True}):
        if {c.lower() for c in el.get('class', [])} & state_words:
            score += 1
            break

    return min(score, 4)


def user_control_score(soup: BeautifulSoup) -> int:
    """
    H3 — User control and freedom.

    Counts elements whose visible text matches recognised control terms:
    cancel, back, reset, undo, go back, return, clear, dismiss, close.

    Non-linear mapping reflects that even one exit control provides a
    meaningful escape path; additional controls give diminishing returns.

    Returns: 0 found→0  1→2  2→3  3+→4

    Ref: Nielsen (1994) H3; Cooper et al. (2014) About Face §18
    """
    CONTROL_TERMS = {
        'cancel', 'back', 'reset', 'undo', 'go back',
        'return', 'clear', 'dismiss', 'close',
    }
    found = {
        id(el) for el in soup.find_all(True)
        if el.get_text(strip=True).lower() in CONTROL_TERMS
    }
    count = len(found)

    if count == 0:   return 0
    elif count == 1: return 2
    elif count == 2: return 3
    else:            return 4


def button_consistency_score(soup: BeautifulSoup) -> int:
    """
    H4 — Consistency and standards.

    Compares the semantic appearance classes of all <button> elements.
    Only visual classes are compared (bg-*, text-*, border-*, rounded-*,
    font-*, shadow-*, ring-*, opacity-*); layout utilities (m-*, flex, w-*)
    are excluded to avoid false inconsistency flags.

    Returns: 1 unique style→4  2→3  3→2  4+→0
    Returns 4 if fewer than 2 buttons (nothing to compare).

    Ref: Nielsen (1994) H4; ISO 9241-110:2020 §4.6
    """
    import re as _re
    SEMANTIC = _re.compile(
        r'\b(bg-\w+|text-\w+|border-\w+|rounded\S*|px-\w+|py-\w+|'
        r'font-\w+|shadow\S*|ring\S*|opacity-\w+)\b'
    )

    buttons = soup.find_all('button')
    if len(buttons) < 2:
        return 4

    signatures = {
        frozenset(SEMANTIC.findall(' '.join(btn.get('class') or [])))
        for btn in buttons
    }
    unique = len(signatures)

    if unique == 1:   return 4
    elif unique == 2: return 3
    elif unique == 3: return 2
    else:             return 0


def error_prevention_score(soup: BeautifulSoup) -> int:
    """
    H5 — Error prevention.

    Counts text-entry inputs (<input> and <textarea>) that carry at least
    one HTML5 constraint validation attribute:
      required, pattern, minlength, maxlength, min, max,
      or a semantic type: email, number, tel, url, date, month,
      week, time, datetime-local.

    Returns round(validated / total × 4)

    Ref: Nielsen (1994) H5; WHATWG HTML Living Standard — Constraint Validation
    """
    EXCLUDED_TYPES = {'hidden', 'submit', 'button', 'image', 'reset', 'file'}
    VALIDATED_TYPES = {
        'email', 'number', 'tel', 'url', 'date', 'month',
        'week', 'time', 'datetime-local',
    }

    inputs = [
        inp for inp in soup.find_all('input')
        if (inp.get('type', 'text') or 'text').lower() not in EXCLUDED_TYPES
    ]
    inputs += soup.find_all('textarea')

    if not inputs:
        return 4

    validated = sum(
        1 for inp in inputs
        if (inp.get('required') is not None
            or inp.get('pattern')
            or inp.get('minlength')
            or inp.get('maxlength')
            or inp.get('min')
            or inp.get('max')
            or (inp.get('type') or '').lower() in VALIDATED_TYPES)
    )
    return round((validated / len(inputs)) * 4)


def recognition_score(soup: BeautifulSoup) -> int:
    """
    H6 — Recognition rather than recall.

    Detects four patterns that present choices visibly rather than requiring
    memory (each +1, capped at 4):
      1. <select> — visible list of valid options
      2. autocomplete attribute — browser-assisted recall
      3. <datalist> — suggestion list for text inputs
      4. Breadcrumb nav (aria-label containing "breadcrumb")

    Added because H6 was entirely absent from the original function set.

    Ref: Nielsen (1994) H6; ISO 9241-110:2020 §4.4
    """
    score = 0

    if soup.find('select'):
        score += 1

    if soup.find(attrs={'autocomplete': True}):
        score += 1

    if soup.find('datalist'):
        score += 1

    if soup.find(attrs={'aria-label': lambda v: v and 'breadcrumb' in v.lower()}):
        score += 1

    return min(score, 4)


def minimalist_design_score(soup: BeautifulSoup) -> int:
    """
    H8 — Aesthetic and minimalist design.

    Computes the ratio of semantic elements to <div> elements:
      ratio = semantic / (semantic + divs)

    Semantic tags counted: main, section, article, aside, header, footer,
    nav, figure, figcaption, details, summary.

    Score thresholds based on empirical HTML5 adoption data
    (Radovanović et al., 2015) where well-structured pages show ratio 0.3-0.5.

    Returns: ≥0.40→4  ≥0.25→3  ≥0.15→2  ≥0.05→1  <0.05→0
    Returns 4 if no divs (or no elements at all).

    Ref: Nielsen (1994) H8; Radovanović et al. (2015)
    """
    SEMANTIC_TAGS = [
        'main', 'section', 'article', 'aside',
        'header', 'footer', 'nav', 'figure',
        'figcaption', 'details', 'summary',
    ]
    semantic_count = sum(len(soup.find_all(tag)) for tag in SEMANTIC_TAGS)
    div_count = len(soup.find_all('div'))
    total = semantic_count + div_count

    if total == 0:
        return 4

    ratio = semantic_count / total
    if ratio >= 0.40:   return 4
    elif ratio >= 0.25: return 3
    elif ratio >= 0.15: return 2
    elif ratio >= 0.05: return 1
    else:               return 0


def error_message_score(soup: BeautifulSoup) -> int:
    """
    H9 — Help users recognise, diagnose, and recover from errors.

    Detects error messaging infrastructure across three overlapping signals,
    then deduplicates by element identity:
      role="alert"            — screen-reader announcement (ARIA 1.2)
      aria-live attribute     — dynamic update region
      class containing error/invalid/warning/danger/alert/feedback

    Returns: 0 elements→0  1→2  2→3  3+→4

    Ref: Nielsen (1994) H9; WAI-ARIA 1.2 role=alert
    """
    ERROR_WORDS = {'error', 'invalid', 'warning', 'danger', 'alert', 'feedback'}

    alerts        = soup.find_all(attrs={'role': 'alert'})
    live_regions  = soup.find_all(attrs={'aria-live': True})
    class_matches = soup.find_all(
        attrs={'class': lambda c: c and any(
            word in w.lower()
            for w in (c if isinstance(c, list) else [c])
            for word in ERROR_WORDS
        )}
    )

    count = len({id(el) for el in alerts + live_regions + class_matches})

    if count == 0:   return 0
    elif count == 1: return 2
    elif count == 2: return 3
    else:            return 4


def help_documentation_score(soup: BeautifulSoup) -> int:
    """
    H10 — Help and documentation.

    Detects four contextual help mechanisms (each +1, capped at 4):
      1. title attribute on any element — hover tooltip
      2. aria-describedby — linked description paragraph
      3. <details> / <summary> — progressive disclosure
      4. Help links (<a> with text/href containing help/faq/guide/tutorial/?)

    Added because H10 was entirely absent from the original function set.

    Ref: Nielsen (1994) H10; ISO 9241-110:2020 §4.8
    """
    HELP_TERMS = {'help', 'faq', 'guide', 'tutorial', 'documentation', 'support', '?'}
    score = 0

    if soup.find(attrs={'title': True}):
        score += 1

    if soup.find(attrs={'aria-describedby': True}):
        score += 1

    if soup.find('details') or soup.find('summary'):
        score += 1

    for link in soup.find_all('a'):
        text = link.get_text(strip=True).lower()
        href = (link.get('href') or '').lower()
        if any(t in text or t in href for t in HELP_TERMS):
            score += 1
            break

    return min(score, 4)


# ---------------------------------------------------------------------------
# Composite
# ---------------------------------------------------------------------------

def compute_nielsen_score(html_string: str) -> dict:
    """
    Parse *html_string* and return a normalised Nielsen heuristic score.

    Sub-metrics
    -----------
    system_status      H1
    user_control       H3
    button_consistency H4
    error_prevention   H5
    recognition        H6  (added)
    minimalist_design  H8
    error_message      H9
    help_documentation H10 (added)

    Formula: nielsen_score = (mean(sub_scores) / 4.0) × 100

    Returns
    -------
    dict
        nielsen_score  int   0-100
        sub_scores     dict  {metric: int 0-4}
        weakest_metric str
    """
    if not html_string or not html_string.strip():
        return {'nielsen_score': 0, 'sub_scores': {}, 'weakest_metric': 'none'}

    soup = BeautifulSoup(html_string, 'lxml')

    scores = {
        'system_status':      system_status_score(soup),
        'user_control':       user_control_score(soup),
        'button_consistency': button_consistency_score(soup),
        'error_prevention':   error_prevention_score(soup),
        'recognition':        recognition_score(soup),
        'minimalist_design':  minimalist_design_score(soup),
        'error_message':      error_message_score(soup),
        'help_documentation': help_documentation_score(soup),
    }

    raw_average = sum(scores.values()) / len(scores)
    return {
        'nielsen_score': round((raw_average / 4.0) * 100),
        'sub_scores':    scores,
        'weakest_metric': min(scores, key=scores.get),
    }