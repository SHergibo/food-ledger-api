let slugify = require('slugify');
slugify.extend({
  ':': '-', 
  '.': '_', 
  '@': 'at'
});

exports.slugUrl = (string) =>{
  return slugify(string, {
    lower: true,
    remove: /[*+~()'"!\/]/g
  })
}