function load() {
  const data = querystringParser()
  $('body').removeClass('play')
  $('ul.stack > li').remove()
  if (data.queue)
    $('#queue').val(data.queue.replace(/,/g, '\n'))
  if (data.args)
    $('#args').val(data.args)
  if (data.size) {
    $('input#size').val(data.size)
    on_size()
  }
  if (data.speed)
    $('input#speed').val(data.speed)
  $('#queue').val(trim($('#done').val()+'\n'+$('#queue').val()))
  $('#done').val('')

  const arr = $('input#args').val().replace(/\s+/g, ' ')
    .split(' ').map((num) => +num)
  const sorted = [...arr].sort((a, b) => a > b)
  const indexes = arr.map((el, index) => sorted.indexOf(el))
  const len = indexes.length - 1
  $(arr).each((k, val) => $('<li></li>').css({
    'background-color': setcolor(indexes[k] / len),
    'height': (indexes[k] / len) * 45 + 5 + '%'
  }).attr('data-val', val).appendTo('div#stack-a > ul'))
}

$('#done').val('')
load()
$('button#load').on('click', load)

function trim(str) {
  return str
    .replace(/^\n+/g, '')
    .replace(/\n+/g, '\n')
    .replace(/\n+$/g, '')
}

function backward() {
  $('body').removeClass('play')
  const val = trim($('#done').val())
  const actions = val.split('\n')
  const action = actions.splice(actions.length - 1, 1)[0] || ''
  $('#done').val(actions.join('\n'))
  if (action == '')
    return
  if (!undo_action(action) && action[0] != ';')
    action = '; ' + action
  $('#queue').val(trim($('#queue').val() + '\n' + action))
}

function forward() {
  const val = trim($('#queue').val())
  const actions = val.split('\n')
  let action = actions.splice(0, 1)[0] || ''
  $('#queue').val(actions.join('\n'))
  if (action == '') {
    $('body').removeClass('play')
    return
  }
  if (!do_action(action) && action[0] != ';')
    action = '; ' + action
  $('#done').val(trim($('#done').val() + '\n' + action))
}

__loop = null;
function loop() {
  if ($('body').hasClass('play'))
    forward()
  const ms = Math.max(50, +$('input#speed').val() || 50);
  clearTimeout(__loop)
  __loop = setTimeout(loop, ms)
}

__loop = setTimeout(loop, 200)

function on_size() {
  const s = parseInt($('input#size').val()) || 4
  $('style#sizecss').html(`
div > ul.stack > li { width:${s}px; }
div > ul.stack > li::after { width:${s}px; font-size:${s}px; }
`)
}

$('input#size').on('change', on_size)

$('button#play, button#pause').on('click', () => {
  $('body').toggleClass('play')
})
$('button#backward').on('click', backward)
$('button#forward').on('click', forward)

function setcolor(index) {
   const r = Math.round(255 * (index - 0.3) * (index > 0.3))
   const g = Math.round(255 * (index - (510 * (index - 0.6)) * (index > 0.6)))
   const b = Math.round(255 * (255 - 510 * index) * (index < 0.5))
   return `rgb(${r}, ${g}, ${b})`
}

function undo_action(action) {
  switch (action.toLowerCase()) {
    case 'pa': return pb()
    case 'pb': return pa()
    case 'ra': return rra()
    case 'rra': return ra()
    case 'rb': return rrb()
    case 'rrb': return rb()
    case 'rr': return rrr()
    case 'rrr': return rr()
    case 'sa': return sa()
    case 'sb': return sb()
  }
  return 0
}

function do_action(action) {
  switch (action.toLowerCase()) {
    case 'pa': return pa()
    case 'pb': return pb()
    case 'ra': return ra()
    case 'rra': return rra()
    case 'rb': return rb()
    case 'rrb': return rrb()
    case 'rr': return rr()
    case 'rrr': return rrr()
    case 'sa': return sa()
    case 'sb': return sb()
  }
  return 0
}

function pa() {
  const $li = $('div#stack-b > ul > li:first')
  if (!$li[0])
    return 0
  $li.prependTo('div#stack-a > ul')
  return 1
}

function pb() {
  const $li = $('div#stack-a > ul > li:first')
  if (!$li[0])
    return 0
  $li.prependTo('div#stack-b > ul')
  return 1
}

function ra() {
  $('div#stack-a > ul > li:first')
    .appendTo('div#stack-a > ul')
  return 1
}

function rra() {
  $('div#stack-a > ul > li:last')
    .prependTo('div#stack-a > ul')
  return 1
}

function rb() {
  $('div#stack-b > ul > li:first')
    .appendTo('div#stack-b > ul')
  return 1
}

function rrb() {
  $('div#stack-b > ul > li:last')
    .prependTo('div#stack-b > ul')
  return 1
}

function rr() {
  return ra() && rb()
}

function rrr() {
  return rra() && rrb()
}

function sa() {
  $('div#stack-a > ul > li:nth-child(2)')
    .prependTo('div#stack-a > ul')
  return 1
}

function sb() {
  $('div#stack-b > ul > li:nth-child(2)')
    .prependTo('div#stack-b > ul')
  return 1
}

function querystringParser(rawHash, opt) { // eslint-disable-line no-unused-vars
  const hash = typeof rawHash === 'undefined' ? document.location.search : rawHash

  const set = function(defVal, optVal) {
    return (typeof optVal === 'undefined') ? defVal : optVal
  }
  const options = {
    starter: set('?', opt && opt.starter),
    sep: set('&', opt && opt.sep),
    eq: set('=', opt && opt.eq)
  }
  const obj = {}
  const enableStarter = (typeof options.starter === 'string')
  try {
    for (let i = 0, varName = null, val = null, char, key; i <= hash.length; i++) {
      char = hash[i]
      if (i === 0 && char === options.starter && enableStarter) {
        continue
      } else if (val === null && char === options.eq) {
        val = ''
      } else if (val === null) {
        varName = ((varName === null) ? '' : varName) + char
      } else if (varName !== null && char !== options.sep && i !== hash.length) {
        val = val + char
      } else {
        if (varName !== '') {
          key = decodeURIComponent(varName)
          switch (typeof obj[key]) {
            case 'undefined':
              obj[key] = decodeURIComponent(val)
              break
            case 'string':
              obj[key] = [decodeURIComponent(val)]
              /* falls through */
            default:
              obj[key].push(decodeURIComponent(val))
          }
        }
        varName = null
        val = null
      }
    }
  } catch (e) {
    console.error(e)
  }
  return obj
}
