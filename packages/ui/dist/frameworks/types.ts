import { J3w1Button } from '@j3w1/ui/components/button';
import { J3w1TextField } from '@j3w1/ui/components/text-field';
const field = document.createElement('j3w1-text-field');
field.value='Typed';field.required=true;field.reportValidity();
const button:J3w1Button=document.createElement('j3w1-button');button.disabled=true;
const typed:J3w1TextField=field;void typed;
