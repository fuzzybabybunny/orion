/**
 * Adds the option the set orionAttribute on SimpleSchema
 */
SimpleSchema.extendOptions({
  orionAttribute: Match.Optional(String),
  orion: Match.Optional(Object)
});

/**
 * Definition of the attributes object
 */
orion.attributes = {};

/**
 * Returns the schema for the attribute
 */
orion.attribute = function(name, schema, options) {
  var schema = schema || {};
  var options = options || {};
  var attributeSchema = orion.attributes[name].getSchema.call(this, options);
  var override = {
    orionAttribute: name,
    autoform: {
      type: 'orion.' + name
    }
  }
  var attribute = orion.helpers.deepExtend(orion.helpers.deepExtend(schema, attributeSchema), override);
  return attribute;
}

/**
 * Returns proper tabular column for the attribute
 */
orion.attributeColumn = function(name, key, title) {
  return {
    data: key,
    title: title,
    defaultContent: '',
    orderable: false,
    render: function() {
      return '';
    },
    createdCell: function(cell, cellData, rowData) {
      var collection = Router.current().collection;
      var schema = Router.current().collection.simpleSchema()._schema[key];
      var data = {
        key: key,
        value: cellData,
        item: rowData,
        schema: schema,
      }
      var template = orion.templates.get('attributeColumn.' + name);
      Blaze.renderWithData(Template[template], data, cell);
    }
  }
}

/**
 * Helper function to use arrays of attributes (Ex: array of images)
 */
orion.arrayOfAttribute = function(name, schema, options) {
  var subSchema = new SimpleSchema({
    item: orion.attribute(name, {
      autoform: {
        label: false
      }
    })
  });
  return orion.helpers.deepExtend(schema, {
    type: [subSchema]
  });
}

/**
 * Creates a new attribute
 */
orion.attributes.registerAttribute = function(name, attribute) {
  check(name, String);
  check(attribute, {
    template: String,
    columnTemplate: Match.Optional(String),
    getSchema: Match.Any,
    valueOut: Match.Any,
    valueIn: Match.Optional(Match.Any),
    valueConverters: Match.Optional(Match.Any),
    contextAdjust: Match.Optional(Match.Any),
  });

  orion.templates.request('attribute.' + name, attribute.template);

  if (attribute.columnTemplate) {
    orion.templates.request('attributeColumn.' + name, attribute.columnTemplate);
  }

  orion.attributes[name] = attribute;

  if (Meteor.isClient) {
    Tracker.autorun(function () {
      AutoForm.addInputType('orion.' + name, {
        template: orion.templates.get('attribute.' + name),
        valueIn: attribute.valueIn,
        valueOut: attribute.valueOut,
        valueConverters: attribute.valueConverters,
        contextAdjust: attribute.contextAdjust
      });
    });
  }
}