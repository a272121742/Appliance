Package.describe({
  summary:'Application Component 基础架构'
});

Package.on_use(function(api){
  api.use('ui','client');
  api.use('reactive-dict',['client','server']);
  api.add_files('Application.js','client');
});