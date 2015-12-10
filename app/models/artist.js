import DS from 'ember-data';

const { Model, attr, hasMany } = DS;

export default Model.extend({
  genre:  attr('string'),
  name:   attr('string'),

  albums: hasMany('albums'),
  songs:  hasMany('songs')
});
