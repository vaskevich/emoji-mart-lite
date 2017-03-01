var fs = require('fs'),
    emojiData = require('emoji-datasource'),
    emojiLib = require('emojilib'),
    inflection = require('inflection'),
    LZString = require('lz-string'),
    mkdirp = require('mkdirp')

var categories = ['People', 'Nature', 'Foods', 'Activity', 'Places', 'Objects', 'Symbols', 'Flags'],
    data = { categories: [], emojis: {}, skins: {}, short_names: {} },
    categoriesIndex = {}

categories.forEach((category, i) => {
  data.categories[i] = { name: category, emojis: [] }
  categoriesIndex[category] = i
})

emojiData.sort((a, b) => {
  var aTest = a.sort_order || a.short_name,
      bTest = b.sort_order || b.short_name

  return aTest - bTest
})

function renameProp(o, key, newKey) {
  if (o[key]) {
    o[newKey] = o[key];
    delete o[key];
  }
}

emojiData.forEach((datum) => {
  var category = datum.category,
      keywords = [],
      categoryIndex

  if (!datum.category) {
    throw new Error('“' + datum.short_name + '” doesn’t have a category')
  }

  datum.name || (datum.name = datum.short_name.replace(/\-/g, ' '))
  datum.name = inflection.titleize(datum.name || '')

  if (datum.category == 'Flags') {
    datum.name = datum.name.replace(/\s(\w+)$/, (letters) => letters.toUpperCase())
  }

  if (!datum.name) {
    throw new Error('“' + datum.short_name + '” doesn’t have a name')
  }

  datum.emoticons = datum.texts || []
  if (datum.text && !datum.emoticons.length) {
    datum.emoticons = [datum.text]
  }

  delete datum.text
  delete datum.texts

  if (emojiLib.lib[datum.short_name]) {
    keywords = emojiLib.lib[datum.short_name].keywords
  }

  datum.keywords = keywords

  if (datum.category == 'Skin Tones') {
    data.skins[datum.short_name] = datum
  } else {
    categoryIndex = categoriesIndex[category]
    data.categories[categoryIndex].emojis.push(datum.short_name)
    data.emojis[datum.short_name] = datum
  }

  datum.short_names.forEach((short_name, i) => {
    if (i == 0) { return }
    data.short_names[short_name] = datum.short_name
  })

  delete datum.docomo
  delete datum.au
  delete datum.softbank
  delete datum.google
  delete datum.image
  delete datum.has_img_apple
  delete datum.has_img_google
  delete datum.has_img_twitter
  delete datum.has_img_emojione
  delete datum.sheet_x
  delete datum.sheet_y
  delete datum.short_name
  delete datum.category
  delete datum.sort_order

  if (datum.skin_variations) {
    datum.skin_variations = {}
  }

  renameProp(datum, 'name', 'n')
  renameProp(datum, 'unified', 'u')
  renameProp(datum, 'variations', 'v')
  renameProp(datum, 'emoticons', 'e')
  renameProp(datum, 'keywords', 'k')
  renameProp(datum, 'short_names', 's')
  renameProp(datum, 'skin_variations', 't')
})

var flags = data.categories[categoriesIndex['Flags']];
flags.emojis.sort()

mkdirp('data', (err) => {
  if (err) throw err

  const compressedData = LZString.compressToBase64(JSON.stringify(data))
  fs.writeFile('data/index.js', `export default '${compressedData}'`, (err) => {
    if (err) throw err
  })
})
