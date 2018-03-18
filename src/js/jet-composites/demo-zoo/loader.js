define(['ojs/ojcore', './viewModel', 'text!./view.html','text!./component.json', 'css!./styles', 'ojs/ojcomposite'],
  function (oj, viewModel, view, metadata) {
    oj.Composite.register('demo-zoo', {
      metadata: {inline: JSON.parse(metadata)},
      viewModel: {inline: viewModel},
      view: {inline: view}
    });
  }
);


