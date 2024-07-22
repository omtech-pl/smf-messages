const languages = config.langs;
const defaultLang = config.defaultLang;

config.openai.apikey = localStorage.getItem('openai-apikey');

modal.innerHTML = content[type.value];
html.value = content[type.value];

let hasChild = (parent, selector) => parent.querySelector(selector) != null;

const updateSQL = (e, type, title, html, dateFrom, timeFrom, dateTo, timeTo, companyId, state, languages) => {

  if (!languages) {
    console.error('Languages is undefined or null');
    return;
  }

  const keys = Object.keys(languages);
  const langs = Object.values(languages);

  const getFields = () => {
    let fields = keys.map(key => (key !== defaultLang ? `content_${key}` : 'content'));
    return fields.join(', ');
  };

  sql.value = `INSERT INTO smf_messages (${getFields()}, company_id, title, type, date_from, date_to, created_at, status)
VALUES (
`;
  for (let i = 0; i < langs.length; i++) {
    let message = listLangs.children[i].dataset.content;
    message = message.replace(/'/g, '`');
    sql.value += `'${message || null}', `
  }
  const now = new Date();
  const formattedDate = now.toISOString().replace('T', ' ').substring(0, 23);
  setLoadingState(false);

  sql.value += `
${companyId.value || null}, 
'${title.value}', 
${type.value || 0}, 
${dateFrom.value ? `'${dateFrom.value} ${timeFrom.value}:00.000'` : null},
${dateTo.value ? `'${dateTo.value} ${timeTo.value}:00.000'` : null},
'${formattedDate}',
${state.checked});`

};

const prepareData = (htmlValue, lang) => ({
  model: config.openai.model,
  messages: [{
    role: config.openai.role,
    content: `IF NEEDS TRANSLATE ${htmlValue} TO ${lang} LANGUAGE. RETURN TRANSLATED HTML. 
    If the text language is ${defaultLang}, leave it untranslated`
  }],
  temperature: config.openai.temperature
});

const sendToOpenAi = async data => {
  try {
    const response = await fetch(config.openai.api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: config.openai.apikey
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    let translatedContent = result.choices?.find(choice => choice?.message)?.message.content ||
      'Translation failed or no content received';
    translatedContent = translatedContent.replace(/'/g, '`');

    return translatedContent;
  } catch (error) {
    console.error('Error:', error);
  }
};

const submitForm = async (e, type, title, html, dateFrom, timeFrom, dateTo, timeTo, companyId, state, languages) => {
  e.preventDefault();
  listLangs.replaceChildren();
  errors.replaceChildren();

  console.log(`
type: ${type.value}
title: ${title.value}
html: ${html.value}
dateFrom: ${dateFrom.value}
timeFrom: ${timeFrom.value}
dateTo: ${dateTo.value}
timeTo: ${timeTo.value}
companyId: ${companyId.value}
state: ${state.checked}
  `);

  if (html.value.trim()) {
    setLoadingState(true);
    const keys = Object.keys(languages);
    const langs = Object.values(languages);

    const getFields = () => {
      const fields = keys.map(key => (key !== defaultLang ? `content_${key}` : 'content'));
      return fields.join(', ');
    };

    sql.value = `INSERT INTO smf_messages (${getFields()}, company_id, title, type, date_from, date_to, created_at, status)
VALUES (
`;

    for (let i = 0; i < langs.length; i++) {
      listLangs.classList.add('disabled');
      type.classList.add('disabled');
      const lang = langs[i]
      const data = prepareData(html.value, lang);

      const listItem = document.createElement('li');
      listItem.className = 'text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-full text-[14px] px-2.5 py-1.5 me-2 mb-2 text-orange-500 dark:bg-gray-800 dark:text-orange-400 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 cursor-pointer';
      listItem.textContent = lang;
      listLangs.appendChild(listItem);

      try {
        const message = await sendToOpenAi(data);
        listItem.dataset.content = message;
        listItem.classList.replace('dark:text-orange-400', 'dark:text-green-400');
        listItem.classList.replace('text-orange-500', 'text-green-600');

        listItem.addEventListener('click', () => {

          const activeItem = document.querySelector('.active');
          if (activeItem && activeItem !== listItem) {
            activeItem.classList.remove('active');
          }
          listItem.classList.add('active');

          modal.innerHTML = listItem.dataset.content;
          html.value = listItem.dataset.content;
        });
        modal.innerHTML = message || 'Error';
        html.value = message || 'Error';
        sql.value += `'${message || null}', `
        if (!message) {
          listLangs.removeChild(listItem);
          errors.innerHTML += `<li class="text-red-500"><span class="line-through">${lang}</span>  ✕  Error: HTTP error! status: 401</li>`;
        }

        if (i == langs.length - 1) {
          const now = new Date();
          const formattedDate = now.toISOString().replace('T', ' ').substring(0, 23);
          setLoadingState(false);
          listLangs.classList.remove('disabled');
          listItem.classList.add('active');
          type.classList.remove('disabled');

          sql.value += `
${companyId.value || null}, 
'${title.value}', 
${type.value || 0}, 
${dateFrom.value ? `'${dateFrom.value} ${timeFrom.value}:00.000'` : null},
${dateTo.value ? `'${dateTo.value} ${timeTo.value}:00.000'` : null},
'${formattedDate}',
${state.checked});`

        }
      } catch (error) {
        console.error(`Error processing language ${lang}:`, error);
      }
    }
  } else {
    modal.innerHTML = 'No message for translation.'
  }
};

const copySQL = () => {
  sql.select();
  navigator.clipboard.writeText(sql.value)
    .then(() => {
      console.log('SQL copied to clipboard successfully!');
    })
    .catch(err => {
      console.error('Failed to copy SQL to clipboard: ', err);
    });
};

document.addEventListener('keyup', e => {
  const {
    id,
    value
  } = e.target;
  const activeItem = document.querySelector('.active');

  switch (id) {
    case 'html':
      modal.innerHTML = value;
      if (activeItem) activeItem.dataset.content = value;
      if (hasChild(listLangs, 'li')) updateSQL(e, type, title, html, dateFrom, timeFrom, dateTo, timeTo, companyId, state, languages)
      break;
    case 'modal':
      html.value = modal.innerHTML;
      if (activeItem) activeItem.dataset.content = modal.innerHTML;
      if (hasChild(listLangs, 'li')) updateSQL(e, type, title, html, dateFrom, timeFrom, dateTo, timeTo, companyId, state, languages)
      break;
    case 'title':
      modalTitle.textContent = value;
      break;
    case 'modalTitle':
      title.value = modalTitle.textContent;
      break;
  }
});

document.addEventListener('change', e => {
  const {
    id,
    value
  } = e.target;
  const activeItem = document.querySelector('.active');

  switch (id) {
    case 'html':
      modal.innerHTML = value;
      if (activeItem) activeItem.dataset.content = value;
      break;
    case 'modal':
      html.value = modal.innerHTML;
      if (activeItem) activeItem.dataset.content = modal.innerHTML;
      break;
    case 'title':
      modalTitle.textContent = value;
      break;
    case 'modalTitle':
      title.value = modalTitle.textContent;
      break;
    case 'type':
      modal.innerHTML = content[type.value];
      html.value = content[type.value];
      listLangs.replaceChildren();
      sql.value = ''
      break;
  }
});

document.addEventListener('click', async e => {
  switch (e.target.id) {
    case 'submit':
      submitForm(e, type, title, html, dateFrom, timeFrom, dateTo, timeTo, companyId, state, languages);
      break;
    case 'copyBtn':
      copySQL();
      break;
  }
});

const setLoadingState = isLoading => {
  if (isLoading) {
    submit.innerHTML = `
      <svg aria-hidden="true" role="status" class="inline w-4 h-4 me-3 text-gray-200 animate-spin dark:text-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#1C64F2"/>
      </svg>
      Loading...`;
    submit.classList.remove('bg-blue-700', 'hover:bg-blue-800', 'dark:bg-blue-600', 'dark:hover:bg-blue-700');
    submit.classList.add('bg-gray-300', 'hover:bg-gray-400', 'dark:bg-gray-700', 'dark:hover:bg-gray-600', 'disabled');

    copyBtn.innerHTML = `
      <svg aria-hidden="true" role="status" class="inline w-4 h-4 me-3 text-gray-200 animate-spin dark:text-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="green"/>
      </svg>
      Loading...`;
    copyBtn.classList.remove('bg-green-700', 'hover:bg-green-800', 'dark:bg-green-600', 'dark:hover:bg-green-700');
    copyBtn.classList.add('bg-gray-300', 'hover:bg-gray-400', 'dark:bg-gray-700', 'dark:hover:bg-gray-600', 'disabled');

  } else {
    submit.innerHTML = 'Translate';
    submit.classList.remove('bg-gray-300', 'hover:bg-gray-400', 'dark:bg-gray-700', 'dark:hover:bg-gray-600', 'disabled');
    submit.classList.add('bg-blue-700', 'hover:bg-blue-800', 'dark:bg-blue-600', 'dark:hover:bg-blue-700');

    copyBtn.innerHTML = 'Copy SQL';
    copyBtn.classList.remove('bg-gray-300', 'hover:bg-gray-400', 'dark:bg-gray-700', 'dark:hover:bg-gray-600', 'disabled');
    copyBtn.classList.add('bg-green-700', 'hover:bg-green-800', 'dark:bg-green-600', 'dark:hover:bg-green-700');
  }
};

const lightSwitch = document.querySelector('.light-switch');
if (localStorage.getItem('dark-mode') === 'true') {
  lightSwitch.checked = true;
}
lightSwitch.addEventListener('change', () => {
  const { checked } = lightSwitch;
  lightSwitch.checked = checked;
  if (lightSwitch.checked) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('dark-mode', true);
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('dark-mode', false);
  }
});

if (localStorage.getItem('dark-mode') === 'true' || (!('dark-mode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.querySelector('html').classList.add('dark');
} else {
  document.querySelector('html').classList.remove('dark');
}

document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('dateFrom');
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  dateInput.value = formattedDate;
});
