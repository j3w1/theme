import assert from 'node:assert/strict';
import test from 'node:test';
import {readJson} from '../scripts/lib/fs.mjs';
import {stylerSettings} from '../ports/windows/src/compatibility.mjs';

test('text-command and suggestion backings are shared once in every shell host and layout',async()=>{
 const host=await readJson('ports/windows/host.json');
 const mapping=await readJson('ports/windows/mapping.json');
 const variants=(await readJson('ports/windows/dist/windows-settings.json')).stylerVariants;
 const tokens=(await readJson('exports/tokens.resolved.json')).profiles.default.tokens;
 const frameKeys=['CommandBarFlyoutBackground','CommandBarFlyoutBorderBrush','CommandBarOverflowPresenterBackground',
  'FlyoutPresenterBackground','FlyoutPresenterBorderBrush','AutoSuggestBoxSuggestionsListBackground','AutoSuggestBoxSuggestionsListBorderBrush'];
 const targets=['Microsoft.UI.Xaml.Controls.Primitives.CommandBarFlyoutCommandBar',
  'CommandBarOverflowPresenter#SecondaryItemsControl','CommandBarOverflowPresenter#SecondaryItemsControl > Grid#LayoutRoot',
  'Grid#OverflowContentRoot','FlyoutPresenter','FlyoutPresenter > Border','Border#SuggestionsContainer','ListView#SuggestionsList'];
 for(const styler of host.stylers){
  const payload=await readJson('ports/windows/dist/'+styler.id+'.json');
  for(const key of frameKeys){
   const values=payload.themeResourceVariables.filter(x=>x.startsWith(key+'='));
   assert.deepEqual(values,[key+'='+tokens[host.resources[key]].css],styler.id+'.'+key);
   assert.ok(mapping.mappings[host.resources[key]].includes('windhawk.resource.'+key));
  }
  for(const selected of [payload,...Object.keys(variants[styler.id]??{}).map(layout=>stylerSettings(payload,variants[styler.id],layout))]){
   for(const target of targets){
    const rules=selected.controlStyles.filter(x=>x.target===target);
    assert.equal(rules.length,1,styler.id+' '+target);
    assert.ok(rules[0].styles.includes('Background='+tokens['color.surface.raised'].css));
   }
  }
  assert.ok(!styler.targets.some(x=>targets.includes(x.target)),'no local override masks shared popup '+styler.id);
 }
 for(const rule of host.menuTargets.slice(9)){
  assert.doesNotMatch(rule.target,/Text=|Content=|Command=/,'matching is independent of command labels');
  assert.ok(Object.keys(rule.styles).every(key=>['Background','Foreground','BorderBrush','BorderThickness','CornerRadius','Fill'].includes(key)),
   'no width, offsets, command, focus or accessibility behavior override');
  for(const [property,role]of Object.entries(rule.styles))assert.ok(mapping.mappings[role].includes('windhawk.menu | '+rule.target+' | '+property));
 }
});

test('text commands have complete rest, hover, pressed, disabled and checked resource states',async()=>{
 const {resources}=await readJson('ports/windows/host.json');
 const prefix='CommandBarFlyoutAppBarButton';
 const expected={
  '':'color.surface.raised',PointerOver:'color.interaction.hover.bg-strong',Pressed:'color.interaction.pressed.bg',Disabled:'color.surface.raised',
  Checked:'color.interaction.selection.bg',CheckedPointerOver:'color.interaction.selection.bg',CheckedPressed:'color.interaction.pressed.bg',CheckedDisabled:'color.interaction.disabled.bg',
 };
 for(const [state,role]of Object.entries(expected)){
  assert.equal(resources[prefix+'Background'+state],role,state);
  const text=state.includes('Disabled')?'color.text.disabled':state==='Checked'||state==='CheckedPointerOver'?'color.interaction.selection.text':'color.text.default';
  assert.equal(resources[prefix+'Foreground'+state],text,state);
 }
 assert.notEqual(resources[prefix+'Background'],resources[prefix+'BackgroundPointerOver'],'pointer exit returns to distinct rest color');
 for(const suffix of ['','PointerOver','Pressed'])assert.equal(resources[prefix+'KeyboardTextLabelForeground'+suffix],'color.text.muted');
 assert.equal(resources[prefix+'SubItemChevronDisabledForeground'],'color.text.disabled');
});

test('Settings suggestion rows retain selection while hovered and use complete native state properties',async()=>{
 const host=await readJson('ports/windows/host.json');
 const settings=host.stylers.find(x=>x.id==='windows-11-settings-styler');
 const presenter=settings.targets.find(x=>x.target==='Windows.UI.Xaml.Controls.Primitives.ListViewItemPresenter');
 assert.ok(presenter,'native primitives namespace is required');
 assert.equal(presenter.styles.Background,'color.surface.raised');
 assert.equal(presenter.styles.PointerOverBackground,'color.interaction.hover.bg-strong');
 assert.equal(presenter.styles.SelectedBackground,'color.interaction.selection.bg');
 assert.equal(presenter.styles.SelectedPointerOverBackground,presenter.styles.SelectedBackground);
 assert.equal(presenter.styles.SelectedPressedBackground,presenter.styles.SelectedBackground);
 assert.equal(presenter.styles.SelectedDisabledBackground,'color.interaction.disabled.bg');
 assert.equal(presenter.styles.SelectedForeground,'color.interaction.selection.text');
 for(const suffix of ['','PointerOver','Pressed','Selected','SelectedPointerOver','SelectedPressed','Disabled','SelectedDisabled']){
  assert.ok(settings.resources['ListViewItemBackground'+suffix],suffix+' resource');
  assert.ok(settings.resources['ListViewItemForeground'+suffix],suffix+' text');
 }
 assert.ok(!Object.keys(presenter.styles).some(x=>/Focus|Opacity|Width|Margin|Padding|Visibility|Template/.test(x)));
 const explorer=host.stylers.find(x=>x.id==='windows-11-file-explorer-styler');
 assert.equal(explorer.targets.find(x=>x.target==='CommandBar#FileExplorerCommandBar').styles.Background,'color.surface.canvas','Explorer toolbar keeps its black background');
});
