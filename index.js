html.addEventListener('keyup', () => {
    modal.innerHTML = html.value;
});
modal.addEventListener('keyup', () => {
    html.value =  modal.innerHTML;
});
title.addEventListener('keyup', () => {
    modalTitle.textContent = title.value;
});
modalTitle.addEventListener('keyup', () => {
    title.value =  modalTitle.textContent;
})