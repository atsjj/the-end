import DS from 'ember-data';

const { Model, attr, belongsTo, hasMany } = DS;

export default Model.extend({
  createdAt:      attr('date'),
  discs:          attr('number'),
  largeArtwork:   attr(),
  mediumArtwork:  attr(),
  name:           attr('string'),
  smallArtwork:   attr(),
  tracks:         attr('number'),

  artist:         belongsTo('artist'),
  songs:          hasMany('songs')
});
