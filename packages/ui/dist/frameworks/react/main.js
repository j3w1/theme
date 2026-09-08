import '@j3w1/ui/register/button';
import '@j3w1/ui/register/text-field';
import '@j3w1/ui/register/checkbox';
import '@j3w1/ui/tokens.css';
import '@j3w1/ui/styles/button.css';
import '@j3w1/ui/styles/text-field.css';
import '@j3w1/ui/styles/checkbox.css';
import React from 'react';import {createRoot} from 'react-dom/client';
function App(){const[result,setResult]=React.useState('Ready');return React.createElement('main',null,React.createElement('h1',null,'Independent consumer'),React.createElement('form',{id:'consumer-form',onSubmit:event=>{event.preventDefault();setResult(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));}},React.createElement('fieldset',{id:'fields'},React.createElement('j3w1-text-field',{id:'field'},React.createElement('div',{className:'text-field'},React.createElement('label',{className:'text-field-label',htmlFor:'project'},'Project'),React.createElement('input',{className:'text-field-input',id:'project',name:'project',defaultValue:'Initial',required:true}))),React.createElement('j3w1-checkbox',{id:'check'},React.createElement('label',{className:'checkbox checkbox-option'},React.createElement('span',{className:'checkbox-control'},React.createElement('input',{className:'checkbox-input',type:'checkbox',name:'enabled',value:'yes'}),React.createElement('svg',{className:'checkbox-check','aria-hidden':'true',viewBox:'0 0 16 16',width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.5},React.createElement('path',{d:'M3.5 8.5l3 3 6-6'}))),React.createElement('span',{className:'checkbox-text'},'Enabled'))),React.createElement('j3w1-button',null,React.createElement('button',{className:'button',type:'submit'},'Save')),React.createElement('j3w1-button',null,React.createElement('button',{className:'button button-secondary',type:'reset'},'Reset')))),React.createElement('p',{role:'status',id:'result'},result));}
createRoot(document.querySelector('#app')).render(React.createElement(App));
