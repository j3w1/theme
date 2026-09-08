<script setup>
import {ref} from 'vue';
const result=ref('Ready');
const save=event=>{result.value=JSON.stringify(Object.fromEntries(new FormData(event.target)));};
</script>
<template><main><h1>Independent consumer</h1><form id="consumer-form" @submit.prevent="save"><fieldset id="fields"><j3w1-text-field id="field"><div class="text-field"><label class="text-field-label" for="project">Project</label><input class="text-field-input" id="project" name="project" value="Initial" required></div></j3w1-text-field><j3w1-checkbox id="check"><label class="checkbox checkbox-option"><span class="checkbox-control"><input class="checkbox-input" type="checkbox" name="enabled" value="yes"><svg class="checkbox-check" aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.5 8.5l3 3 6-6"></path></svg></span><span class="checkbox-text">Enabled</span></label></j3w1-checkbox><j3w1-button><button class="button" type="submit">Save</button></j3w1-button><j3w1-button><button class="button button-secondary" type="reset">Reset</button></j3w1-button></fieldset></form><p role="status" id="result">{{ result }}</p></main></template>
