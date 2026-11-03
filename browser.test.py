from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import threading, os
from pathlib import Path
os.chdir(Path(__file__).resolve().parent)
server=ThreadingHTTPServer(('127.0.0.1',0),SimpleHTTPRequestHandler)
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
 engine=os.environ.get('BROWSER','chromium')
 browser=getattr(p,engine).launch(**({'executable_path':'/usr/bin/chromium','args':['--no-sandbox']} if engine=='chromium' else {}))
 page=browser.new_page(viewport={'width':1100,'height':950})
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(f'http://127.0.0.1:{server.server_port}')
 # Existing storage migration, including old dated tasks.
 page.evaluate("localStorage.setItem('daily.tasks.v1', JSON.stringify([{id:'old',title:'Önceki görev',date:'2026-11-01',done:false,pinned:true}]))")
 page.reload()
 assert page.locator('#active-list .task').count()==1
 for title in ['Ders çalış','Yürüyüş yap']:
  page.locator('#task-title').fill(title);page.locator('#task-title').press('Enter')
 page.get_by_role('button',name='Yürüyüş yap: yukarı taşı',exact=True).click()
 assert page.locator('#active-list .task-name').all_text_contents()==['Önceki görev','Yürüyüş yap','Ders çalış']
 page.get_by_role('button',name='Yürüyüş yap: tamamla',exact=True).click()
 assert page.locator('#done-list .task-name').inner_text()=='Yürüyüş yap'
 page.locator('#undo-button').click()
 assert page.locator('#active-list .task-name').all_text_contents()==['Önceki görev','Yürüyüş yap','Ders çalış']
 page.get_by_role('button',name='Yürüyüş yap: tamamla',exact=True).click()
 alarm=page.locator('input[aria-label="Ders çalış: alarm zamanı"]')
 future=page.evaluate("(()=>{let d=new Date(Date.now()+3600000);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')})()")
 alarm.fill(future);alarm.dispatch_event('change')
 assert page.get_by_text('Alarm kurulu',exact=True).count()==1
 page.reload()
 assert page.locator('input[aria-label="Ders çalış: alarm zamanı"]').input_value()==future
 assert page.locator('#done-list .task-name').inner_text()=='Yürüyüş yap'
 page.locator('#enable-sound').click()
 assert 'Ses açık' in page.locator('#enable-sound').inner_text()
 page.evaluate('audio.suspend()')
 page.wait_for_timeout(100)
 assert page.locator('#enable-sound').inner_text()=='Alarm sesini aç'
 page.locator('#enable-sound').click()
 # A hidden Safari page must not consume its pending alarm.
 page.evaluate("Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'})")
 # Move the clock past the saved alarm to exercise the real timer.
 page.evaluate("Date.now = () => new Date('"+future+"').getTime()+1000")
 page.wait_for_timeout(1300)
 assert not page.locator('#alarm-alert').is_visible()
 page.evaluate("Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'))")
 assert page.locator('#alarm-alert').is_visible()
 assert page.locator('#alarm-items').inner_text()=='Ders çalış'
 page.reload()
 assert page.locator('#alarm-alert').is_visible()
 page.locator('#dismiss-alarm').click();page.wait_for_timeout(1200)
 assert not page.locator('#alarm-alert').is_visible()
 page.reload()
 assert not page.locator('#alarm-alert').is_visible()
 page.screenshot(path='artifacts/desktop.png',full_page=True)
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 page.screenshot(path='artifacts/mobile.png',full_page=True)
 for width in [320,375,430,844]:
  page.set_viewport_size({'width':width,'height':844})
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
  assert page.locator('input[type=datetime-local]').first.evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)')>=16
 assert not errors,errors
 print('PASS: previous records, quick add, reorder, right tick, completed section, undo, reload persistence, alarm schedule/fire/dismiss, audio activation, mobile overflow')
 # Storage denial must not falsely show a saved task.
 denied=browser.new_page()
 denied.add_init_script("Storage.prototype.setItem=function(){throw new DOMException('Denied','QuotaExceededError')}")
 denied.goto(f'http://127.0.0.1:{server.server_port}')
 denied.locator('#task-title').fill('Kaydedilmemeli')
 denied.locator('#add-button').click()
 assert denied.locator('#active-list .task').count()==0
 assert 'Kaydedilemedi' in denied.locator('#toast-text').inner_text()
 print('PASS: resume sound, visibility/pageshow recovery, persistent alarm alert and acknowledgement, 320–844px widths, 16px date inputs, storage denial')
 browser.close()
server.shutdown()
