import DS from 'ember-data';

export default DS.Model.extend({
  createdAt:      DS.attr('date'),
  discs:          DS.attr('number'),
  largeArtwork:   DS.attr('string'),
  mediumArtwork:  DS.attr('string'),
  name:           DS.attr('string'),
  smallArtwork:   DS.attr('string'),
  tracks:         DS.attr('number'),

  artist:         DS.belongsTo('artist', { async: false }),
  songs:          DS.hasMany('songs', { async: false })
});
