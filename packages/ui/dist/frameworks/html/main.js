import '@j3w1/ui/register/button';
import '@j3w1/ui/register/text-field';
import '@j3w1/ui/register/checkbox';
import '@j3w1/ui/tokens.css';
import '@j3w1/ui/styles/button.css';
import '@j3w1/ui/styles/text-field.css';
import '@j3w1/ui/styles/checkbox.css';
document.querySelector('form').addEventListener('submit',event=>{event.preventDefault();document.querySelector('#result').textContent=JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)));});