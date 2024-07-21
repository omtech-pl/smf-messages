document.addEventListener('keyup', e => {
    if(e.target.id === 'html') modal.innerHTML = html.value;
    if(e.target.id === 'modal') html.value =  modal.innerHTML;
    if(e.target.id === 'title') modalTitle.textContent = title.value;;
    if(e.target.id === 'modalTitle') title.value =  modalTitle.textContent;
});
