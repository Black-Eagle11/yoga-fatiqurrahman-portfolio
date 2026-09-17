(() => {
  const form = document.querySelector('#gpa-form');
  if (!form) return;

  const fields = {
    currentCredits: document.querySelector('#current-credits'),
    currentGpa: document.querySelector('#current-gpa'),
    nextCredits: document.querySelector('#next-credits'),
    targetGpa: document.querySelector('#target-gpa')
  };

  const resultPanel = document.querySelector('#result-panel');
  const emptyPanel = document.querySelector('#empty-result');
  const requiredValue = document.querySelector('#required-value');
  const resultLabel = document.querySelector('#result-label');
  const resultMessage = document.querySelector('#result-message');
  const maxGpa = document.querySelector('#max-gpa');
  const qualityPoints = document.querySelector('#quality-points');
  const progress = document.querySelector('#result-progress');
  const historyBody = document.querySelector('#history-body');
  const historyEmpty = document.querySelector('#history-empty');
  const clearHistory = document.querySelector('#clear-history');
  const exampleButton = document.querySelector('#fill-example');
  const toast = document.querySelector('#toast');

  const storageKey = 'yoga-gpa-history-v1';

  const number = (input) => Number.parseFloat(input.value.replace(',', '.'));
  const format = (value) => Number(value).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
  };

  const getHistory = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const setHistory = (items) => {
    localStorage.setItem(storageKey, JSON.stringify(items.slice(0, 5)));
  };

  const getStatus = (required) => {
    if (required > 4) {
      return {
        label: 'Belum mungkin dalam 1 semester',
        message: 'Target membutuhkan IPS di atas 4,00. Turunkan target atau tambahkan jumlah SKS pada periode perhitungan.',
        color: '#e5484d'
      };
    }
    if (required < 0) {
      return {
        label: 'Target sudah terlampaui',
        message: 'Bahkan tanpa tambahan mutu, IPK saat ini sudah berada di atas target.',
        color: '#00a878'
      };
    }
    if (required >= 3.75) {
      return {
        label: 'Menantang, tetapi mungkin',
        message: 'Kamu perlu performa nyaris sempurna. Prioritaskan mata kuliah berbobot SKS besar.',
        color: '#f59e0b'
      };
    }
    if (required >= 3) {
      return {
        label: 'Target realistis',
        message: 'Target dapat dicapai dengan performa akademik yang konsisten semester depan.',
        color: '#285cff'
      };
    }
    return {
      label: 'Target sangat aman',
      message: 'IPS yang dibutuhkan berada pada rentang yang cukup aman.',
      color: '#00a878'
    };
  };

  const validate = () => {
    let valid = true;
    const values = {
      currentCredits: number(fields.currentCredits),
      currentGpa: number(fields.currentGpa),
      nextCredits: number(fields.nextCredits),
      targetGpa: number(fields.targetGpa)
    };

    Object.entries(fields).forEach(([key, input]) => {
      const value = values[key];
      let fieldValid = Number.isFinite(value);
      if (key.includes('Credits')) fieldValid = fieldValid && value > 0 && value <= 300;
      if (key.includes('Gpa')) fieldValid = fieldValid && value >= 0 && value <= 4;
      input.setAttribute('aria-invalid', String(!fieldValid));
      valid = valid && fieldValid;
    });

    return valid ? values : null;
  };

  const renderHistory = () => {
    const items = getHistory();
    historyBody.innerHTML = '';
    historyEmpty.classList.toggle('hidden', items.length > 0);
    clearHistory.classList.toggle('hidden', items.length === 0);

    items.forEach((item) => {
      const row = document.createElement('tr');
      row.className = 'border-t border-ui';
      row.innerHTML = `
        <td class="py-4 pr-4 font-bold">${format(item.target)}</td>
        <td class="px-4 py-4 text-muted">${item.currentCredits} + ${item.nextCredits} SKS</td>
        <td class="py-4 pl-4 text-right font-black" style="color:${item.required > 4 ? '#e5484d' : 'var(--electric)'}">${format(item.required)}</td>
      `;
      historyBody.appendChild(row);
    });
  };

  const calculate = (values, shouldSave = true) => {
    const currentPoints = values.currentGpa * values.currentCredits;
    const totalCredits = values.currentCredits + values.nextCredits;
    const requiredPoints = (values.targetGpa * totalCredits) - currentPoints;
    const required = requiredPoints / values.nextCredits;
    const maximum = (currentPoints + (4 * values.nextCredits)) / totalCredits;
    const status = getStatus(required);

    requiredValue.textContent = format(Math.max(0, required));
    resultLabel.textContent = status.label;
    resultLabel.style.color = status.color;
    resultMessage.textContent = status.message;
    maxGpa.textContent = format(maximum);
    qualityPoints.textContent = format(Math.max(0, requiredPoints));
    progress.style.width = `${Math.min(100, Math.max(0, (required / 4) * 100))}%`;
    progress.style.background = status.color;

    emptyPanel.classList.add('hidden');
    resultPanel.classList.remove('hidden');
    resultPanel.setAttribute('tabindex', '-1');
    resultPanel.focus({ preventScroll: true });

    if (shouldSave) {
      const history = getHistory();
      history.unshift({
        target: values.targetGpa,
        currentCredits: values.currentCredits,
        nextCredits: values.nextCredits,
        required,
        savedAt: Date.now()
      });
      setHistory(history);
      renderHistory();
      showToast('Perhitungan disimpan ke riwayat');
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = validate();
    if (!values) {
      showToast('Periksa kembali angka yang kamu masukkan');
      const invalid = form.querySelector('[aria-invalid="true"]');
      if (invalid) invalid.focus();
      return;
    }
    calculate(values);
  });

  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      Object.values(fields).forEach((field) => field.setAttribute('aria-invalid', 'false'));
      resultPanel.classList.add('hidden');
      emptyPanel.classList.remove('hidden');
    }, 0);
  });

  Object.values(fields).forEach((field) => {
    field.addEventListener('input', () => field.setAttribute('aria-invalid', 'false'));
  });

  exampleButton.addEventListener('click', () => {
    fields.currentCredits.value = '40';
    fields.currentGpa.value = '3.46';
    fields.nextCredits.value = '24';
    fields.targetGpa.value = '3.60';
    Object.values(fields).forEach((field) => field.setAttribute('aria-invalid', 'false'));
    calculate({ currentCredits: 40, currentGpa: 3.46, nextCredits: 24, targetGpa: 3.60 }, false);
    showToast('Data contoh dimuat');
  });

  clearHistory.addEventListener('click', () => {
    localStorage.removeItem(storageKey);
    renderHistory();
    showToast('Riwayat dihapus');
  });

  renderHistory();
})();
