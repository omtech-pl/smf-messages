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
