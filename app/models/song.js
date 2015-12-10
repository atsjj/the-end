import DS from 'ember-data';

export default DS.Model.extend({
  createdAt:  DS.attr('date'),
  disc:       DS.attr('number'),
  genre:      DS.attr('string'),
  name:       DS.attr('string'),
  time:       DS.attr('number'),
  track:      DS.attr('number'),

  album:      DS.belongsTo('album', { async: false }),
  artist:     DS.belongsTo('artist', { async: false })
});
