export const groups = [
  { title: 'DASHBOARDS', links: ['analytics','crm','commerce','academy','logistics'].map(id => [`/dashboards/${id}`, id]) },
  { title: 'RECORDS', links: ['products','orders','customers','users','invoices'].map(id => [`/records/${id}`, id]) },
  { title: 'APPLICATIONS', links: ['email','chat','calendar','kanban'].map(id => [`/apps/${id}`, id]) },
  { title: 'FORMS & SYSTEM', links: ['basic','advanced','wizard','uploads','builder','charts','developer'].map(id => [`/forms/${id}`, id]).concat([['/components', 'All components']]) },
  { title: 'PAGES', links: ['profile','settings','permissions','sign-in','recovery','pricing','help','not-found','error'].map(id => [`/pages/${id}`, id]) },
];
// Paths here are Vue Router hash destinations, not HTTP resource URLs.
export const hashDestinations = groups.flatMap(group => group.links.map(([path]) => path));
