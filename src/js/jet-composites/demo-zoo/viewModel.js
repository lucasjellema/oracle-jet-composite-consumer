define([], 
    function () {
        function model(context) {
            var self = this;
            self.props;

            context.props.then(function(properties) {
                //Save the resolved properties for later access
                self.props = properties;
            });

            self.addAnimal = function(animal) {
                // To trigger property change events for array properties,
                // create a copy of the array value, update, and set the array property
                // to the copy.
                var copy = self.props.animals.slice();
                copy.push(animal);
                self.props.animals = copy;
            };
        };
        
        return model;
    }
);


