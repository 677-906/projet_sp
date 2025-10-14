import Modal from 'react-modal';

// This is to prevent a warning from react-modal
// "react-modal: No elements were found for selector #root."
const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

Modal.setAppElement('#root');