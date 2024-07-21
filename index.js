const submitForm = (e, type, title, html, dateFrom, timeFrom, dateTo, timeTo, companyId, state) => {
  e.preventDefault();
  console.log(`
type: ${type.value}
title: ${title.value}
html: ${html.value}
dateFrom: ${dateFrom.value}
timeFrom: ${timeFrom.value}
dateTo: ${dateTo.value}
timeTo: ${timeTo.value}
companyId: ${companyId.value}
state: ${state.value}
  `);
};
const copySQL = () => {
  console.log('Copy SQL')
};

document.addEventListener('keyup', e => {
  switch (e.target.id) {
    case 'html':
      modal.innerHTML = html.value;
      break;
    case 'modal':
      html.value = modal.innerHTML;
      break;
    case 'title':
      modalTitle.textContent = title.value;
      break;
    case 'modalTitle':
      title.value = modalTitle.textContent;
      break;
  }
});

document.addEventListener('click', e => {
  switch (e.target.id) {
    case 'submit':
      submitForm(e, type, title, html, dateFrom, timeFrom, dateTo, timeTo, companyId, state);
      break;
    case 'copySQL': 
      copySQL();
      break;
  }
});
