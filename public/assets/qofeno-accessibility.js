/* Presentation-only compatibility fix for the preserved Qofeno client.
 * A <dd> cannot receive an accessible name via aria-label. Keep its definition
 * semantics and React-owned value nodes; expose the same label as hidden text.
 */
(() => {
  const selector = '.visitor-activity [data-visitor-metric]';
  const descriptionAttribute = 'data-qofeno-metric-description';
  const labels = new WeakMap();

  function update(metric) {
    if (!metric.matches(selector)) return;
    const currentLabel = metric.getAttribute('aria-label');
    if (currentLabel !== null) labels.set(metric, currentLabel);
    const label = currentLabel ?? labels.get(metric);
    if (!label) return;

    let description = metric.querySelector(`[${descriptionAttribute}]`);
    const visibleText = Array.from(metric.childNodes)
      .filter(node => node !== description && !(node.nodeType === 1 && node.getAttribute('aria-hidden') === 'true'))
      .map(node => node.textContent ?? '')
      .join('')
      .trim();
    // Normal values need only the unit appended. Abbreviated values retain the
    // precise original label, and unavailable/paused values get the full status.
    const text = visibleText && label.startsWith(`${visibleText} `)
      ? label.slice(visibleText.length)
      : visibleText ? ` (${label})` : label;

    if (!description) {
      description = document.createElement('span');
      description.setAttribute(descriptionAttribute, '');
      description.className = 'qofeno-metric-description';
      description.textContent = text;
      metric.append(description);
    } else if (description.textContent !== text) {
      description.textContent = text;
    }
    if (currentLabel !== null) metric.removeAttribute('aria-label');
  }

  function collect(node, pending) {
    const element = node.nodeType === 1 ? node : node.parentElement;
    if (!element) return;
    const metric = element.closest('[data-visitor-metric]');
    if (metric?.matches(selector)) pending.add(metric);
    element.querySelectorAll?.(selector).forEach(item => pending.add(item));
  }

  document.querySelectorAll(selector).forEach(update);
  const root = document.getElementById('root');
  if (!root) return;
  const observer = new MutationObserver(records => {
    const pending = new Set();
    for (const record of records) {
      if (record.type === 'childList') {
        // Only additions need descendant discovery; existing metric nodes are
        // also checked when React replaces a text value with a status marker.
        const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
        const metric = target?.closest('[data-visitor-metric]');
        if (metric?.matches(selector)) pending.add(metric);
        record.addedNodes.forEach(node => collect(node, pending));
      } else {
        const element = record.target.nodeType === 1 ? record.target : record.target.parentElement;
        const metric = element?.closest('[data-visitor-metric]');
        if (metric?.matches(selector)) pending.add(metric);
      }
    }
    pending.forEach(update);
  });
  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-label'],
  });
})();
