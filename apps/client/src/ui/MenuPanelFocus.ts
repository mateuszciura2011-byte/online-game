/** Keeps the existing menu dialog independent of the gameplay input system. */
export class MenuPanelFocus {
  private opener:HTMLElement|null=null;
  private previousInert=new Map<HTMLElement,boolean>();
  constructor(private panel:HTMLElement,private background:HTMLElement[],private dismiss:()=>void) {
    panel.addEventListener('keydown',event=>{
      if(panel.classList.contains('hidden'))return;
      if(event.key==='Escape') {event.preventDefault();event.stopPropagation();dismiss();return;}
      if(event.key!=='Tab')return;
      const controls=[...panel.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')].filter(el=>el.getClientRects().length>0);
      const first=controls[0],last=controls[controls.length-1];
      if(!first||!last)return;
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });
  }
  open() {
    if(!this.previousInert.size) {
      this.opener=document.activeElement instanceof HTMLElement?document.activeElement:null;
      for(const element of this.background){this.previousInert.set(element,element.inert);element.inert=true;}
    }
    this.panel.setAttribute('role','dialog');this.panel.setAttribute('aria-modal','true');
    this.panel.setAttribute('aria-label',this.panel.querySelector('h2')?.textContent??'Panel gracza');
    this.panel.querySelector<HTMLElement>('#close-panel')?.focus({preventScroll:true});
  }
  close(restoreFocus=true) {
    for(const [element,inert] of this.previousInert)element.inert=inert;
    this.previousInert.clear();
    if(restoreFocus&&this.opener?.isConnected)this.opener.focus({preventScroll:true});
    this.opener=null;
  }
}
