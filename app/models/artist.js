import DS from 'ember-data';

export default DS.Model.extend({
  genre:  DS.attr('string'),
  name:   DS.attr('string'),

  albums: DS.hasMany('albums', { async: false }),
  songs:  DS.hasMany('songs', { async: false })
});
