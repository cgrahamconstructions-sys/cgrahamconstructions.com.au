// C Graham Constructions - Customer Service Chatbot
// Connects to Base44 backend for AI responses + lead capture
(function() {
  const BRAND = {
    name: 'CGC Assistant',
    color: '#1A6FA8',
    accent: '#F4A261',
    logo: 'https://cgrahamconstructions.com.au/favicon.ico',
    greeting: "G'day! I'm the CGC Assistant. I can help with inspection bookings, quotes, granny flat enquiries and general questions. What can I help you with today?",
    business: 'C Graham Constructions',
    phone: '0476 015 224',
    email: 'cgrahamconstructions@gmail.com',
    qbcc: '15114537',
    abn: '19 629 871 290'
  };

  // Only inject once
  if (document.getElementById('cgc-chatbot-widget')) return;

  const style = document.createElement('style');
  style.textContent = `
    #cgc-chatbot-widget { position:fixed; bottom:24px; right:24px; z-index:9999; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    #cgc-chat-bubble { width:60px; height:60px; border-radius:50%; background:${BRAND.color}; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 20px rgba(0,0,0,0.3); transition:transform .2s; }
    #cgc-chat-bubble:hover { transform:scale(1.1); }
    #cgc-chat-bubble svg { width:28px; height:28px; fill:white; }
    #cgc-chat-panel { display:none; position:absolute; bottom:72px; right:0; width:340px; max-height:520px; background:#fff; border-radius:16px; box-shadow:0 8px 40px rgba(0,0,0,0.2); overflow:hidden; flex-direction:column; }
    #cgc-chat-panel.open { display:flex; }
    #cgc-chat-header { background:${BRAND.color}; color:white; padding:14px 16px; display:flex; align-items:center; gap:10px; }
    #cgc-chat-header strong { font-size:15px; }
    #cgc-chat-header span { font-size:11px; opacity:.85; }
    #cgc-chat-close { margin-left:auto; cursor:pointer; opacity:.8; font-size:20px; line-height:1; }
    #cgc-chat-messages { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:10px; min-height:200px; max-height:320px; background:#f8f9fa; }
    .cgc-msg { max-width:85%; padding:10px 13px; border-radius:12px; font-size:13.5px; line-height:1.5; }
    .cgc-msg.bot { background:white; align-self:flex-start; color:#222; border:1px solid #e5e7eb; border-bottom-left-radius:3px; }
    .cgc-msg.user { background:${BRAND.color}; color:white; align-self:flex-end; border-bottom-right-radius:3px; }
    .cgc-msg.typing { background:white; border:1px solid #e5e7eb; align-self:flex-start; }
    #cgc-chat-input-area { padding:10px; border-top:1px solid #e5e7eb; display:flex; gap:8px; background:white; }
    #cgc-chat-input { flex:1; border:1px solid #ddd; border-radius:20px; padding:8px 14px; font-size:13px; outline:none; }
    #cgc-chat-input:focus { border-color:${BRAND.color}; }
    #cgc-chat-send { background:${BRAND.color}; color:white; border:none; border-radius:50%; width:36px; height:36px; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; }
    #cgc-lead-form { padding:14px; background:#fff; display:none; flex-direction:column; gap:10px; }
    #cgc-lead-form h4 { margin:0; color:${BRAND.color}; font-size:14px; }
    #cgc-lead-form input { border:1px solid #ddd; border-radius:8px; padding:8px 12px; font-size:13px; outline:none; }
    #cgc-lead-form input:focus { border-color:${BRAND.color}; }
    #cgc-lead-submit { background:${BRAND.accent}; color:white; border:none; border-radius:8px; padding:10px; font-weight:600; cursor:pointer; font-size:13px; }
    .cgc-quick-btns { display:flex; flex-wrap:wrap; gap:6px; margin-top:4px; }
    .cgc-quick-btn { background:white; border:1px solid ${BRAND.color}; color:${BRAND.color}; border-radius:16px; padding:5px 10px; font-size:12px; cursor:pointer; white-space:nowrap; }
    .cgc-quick-btn:hover { background:${BRAND.color}; color:white; }
  `;
  document.head.appendChild(style);

  const widget = document.createElement('div');
  widget.id = 'cgc-chatbot-widget';
  widget.innerHTML = `
    <div id="cgc-chat-panel">
      <div id="cgc-chat-header">
        <div>
          <strong>${BRAND.name}</strong><br>
          <span>C Graham Constructions · QBCC ${BRAND.qbcc}</span>
        </div>
        <span id="cgc-chat-close">✕</span>
      </div>
      <div id="cgc-chat-messages"></div>
      <div id="cgc-lead-form">
        <h4>📋 Leave your details and we'll be in touch</h4>
        <input id="cgc-lead-name" placeholder="Full Name *" required />
        <input id="cgc-lead-email" placeholder="Email Address *" type="email" required />
        <input id="cgc-lead-phone" placeholder="Phone Number *" type="tel" required />
        <input id="cgc-lead-interest" placeholder="What are you enquiring about?" />
        <button id="cgc-lead-submit">Send Enquiry →</button>
      </div>
      <div id="cgc-chat-input-area">
        <input id="cgc-chat-input" placeholder="Type a message..." maxlength="500" />
        <button id="cgc-chat-send">➤</button>
      </div>
    </div>
    <div id="cgc-chat-bubble">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    </div>
  `;
  document.body.appendChild(widget);

  const panel = document.getElementById('cgc-chat-panel');
  const bubble = document.getElementById('cgc-chat-bubble');
  const messages = document.getElementById('cgc-chat-messages');
  const input = document.getElementById('cgc-chat-input');
  const sendBtn = document.getElementById('cgc-chat-send');
  const leadForm = document.getElementById('cgc-lead-form');

  let leadCaptured = false;
  let sessionId = Math.random().toString(36).substr(2, 9);
  let chatHistory = [];
  let awaitingLead = false;

  const KNOWLEDGE = {
    inspections: `We offer pre-purchase, new build stage, granny flat, renovation, and handover inspections. Book online at inspections.cgrahamconstructions.com.au or call ${BRAND.phone}.`,
    pricing: `Inspection prices range from $220–$450 depending on property type and size. Get an exact quote by booking online or calling us.`,
    granny_flats: `Carl has 40 years experience building granny flats and secondary dwellings on the Sunshine Coast. We handle council approvals, design, and construction. Call ${BRAND.phone} for a free consultation.`,
    contact: `Phone: ${BRAND.phone} | Email: ${BRAND.email} | QBCC Lic: ${BRAND.qbcc} | ABN: ${BRAND.abn}`,
    location: `We service the Sunshine Coast QLD including Palmview, Caloundra, Maroochydore, Noosa and surrounding areas.`,
    store: `We sell digital construction guides and inspection checklists at store.cgrahamconstructions.com.au`,
    experience: `Carl Graham has 40 years experience — starting as a bricklayer, progressing to builder, property developer, and now a licensed building inspector. QBCC Lic: ${BRAND.qbcc}.`
  };

  function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `cgc-msg ${sender}`;
    div.innerHTML = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function addQuickReplies(options) {
    const div = document.createElement('div');
    div.className = 'cgc-quick-btns';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'cgc-quick-btn';
      btn.textContent = opt;
      btn.onclick = () => { div.remove(); handleMessage(opt); };
      div.appendChild(btn);
    });
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    const div = addMessage('<span>●</span> <span>●</span> <span>●</span>', 'bot typing');
    return div;
  }

  function getResponse(msg) {
    const m = msg.toLowerCase();
    if (m.includes('inspect') || m.includes('book') || m.includes('appointment'))
      return { text: `${KNOWLEDGE.inspections}<br><br><a href="https://inspections.cgrahamconstructions.com.au" target="_blank" style="color:${BRAND.color};font-weight:600">📅 Book Online →</a>`, quick: ['Get a quote', 'What areas?', 'How long does it take?'] };
    if (m.includes('price') || m.includes('cost') || m.includes('how much') || m.includes('quote'))
      return { text: KNOWLEDGE.pricing, quick: ['Book an inspection', 'Contact Carl', 'Leave my details'] };
    if (m.includes('granny') || m.includes('secondary') || m.includes('dwelling'))
      return { text: KNOWLEDGE.granny_flats, quick: ['Book consultation', 'What areas?', 'How long does it take?'] };
    if (m.includes('contact') || m.includes('phone') || m.includes('call') || m.includes('email'))
      return { text: `📞 <strong>${BRAND.phone}</strong><br>📧 <strong>${BRAND.email}</strong><br><br>Or leave your details and Carl will call you back.`, quick: ['Leave my details', 'Book online'] };
    if (m.includes('area') || m.includes('location') || m.includes('where') || m.includes('travel'))
      return { text: KNOWLEDGE.location, quick: ['Book an inspection', 'Get a quote'] };
    if (m.includes('experience') || m.includes('qualified') || m.includes('licence') || m.includes('qbcc'))
      return { text: KNOWLEDGE.experience, quick: ['Book an inspection', 'Contact Carl'] };
    if (m.includes('store') || m.includes('checklist') || m.includes('template') || m.includes('guide') || m.includes('download'))
      return { text: `${KNOWLEDGE.store}<br><br><a href="https://store.cgrahamconstructions.com.au" target="_blank" style="color:${BRAND.color};font-weight:600">🛒 Visit Store →</a>`, quick: ['Book an inspection', 'Contact Carl'] };
    if (m.includes('leave') || m.includes('details') || m.includes('callback') || m.includes('enquir'))
      return { text: null, action: 'lead_form' };
    return { text: `Thanks for your message! For specific enquiries, Carl is available at <strong>${BRAND.phone}</strong> or I can take your details for a callback.`, quick: ['Book an inspection', 'Get a quote', 'Leave my details', 'Contact info'] };
  }

  function handleMessage(text) {
    if (!text.trim()) return;
    addMessage(text, 'user');
    input.value = '';
    chatHistory.push({ role: 'user', content: text });

    const typing = showTyping();
    setTimeout(() => {
      typing.remove();
      if (!leadCaptured) {
        const needsLead = ['book', 'quote', 'inspect', 'granny', 'build', 'consult', 'leave', 'detail', 'callback'].some(k => text.toLowerCase().includes(k));
        if (needsLead && awaitingLead === false) {
          awaitingLead = true;
          addMessage("I can help with that! To get you the best response from Carl, could I get your details first?", 'bot');
          setTimeout(() => showLeadForm(), 400);
          return;
        }
      }
      const resp = getResponse(text);
      if (resp.action === 'lead_form') { showLeadForm(); return; }
      if (resp.text) addMessage(resp.text, 'bot');
      if (resp.quick) addQuickReplies(resp.quick);
    }, 800);
  }

  function showLeadForm() {
    leadForm.style.display = 'flex';
    messages.style.maxHeight = '160px';
    document.getElementById('cgc-chat-input-area').style.display = 'none';
  }

  document.getElementById('cgc-lead-submit').onclick = function() {
    const name = document.getElementById('cgc-lead-name').value.trim();
    const email = document.getElementById('cgc-lead-email').value.trim();
    const phone = document.getElementById('cgc-lead-phone').value.trim();
    const interest = document.getElementById('cgc-lead-interest').value.trim();
    if (!name || !email || !phone) { alert('Please fill in name, email and phone.'); return; }
    
    // Submit to backend
    fetch('https://app.base44.com/api/apps/69ca5e07db7008c68a160911/functions/captureWebsiteLead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, interest, source: 'CGC Website Chatbot', site: 'cgrahamconstructions.com.au', sessionId })
    }).catch(() => {});

    leadCaptured = true;
    leadForm.style.display = 'none';
    messages.style.maxHeight = '320px';
    document.getElementById('cgc-chat-input-area').style.display = 'flex';
    addMessage(`Thanks ${name}! Carl will be in touch shortly at <strong>${phone}</strong>. Is there anything else I can help you with?`, 'bot');
    addQuickReplies(['Book an inspection', 'Visit our store', 'What areas do you cover?']);
  };

  bubble.onclick = () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && messages.children.length === 0) {
      setTimeout(() => {
        addMessage(BRAND.greeting, 'bot');
        addQuickReplies(['Book an inspection', 'Get a quote', 'Granny flats', 'Contact info']);
      }, 300);
    }
  };

  document.getElementById('cgc-chat-close').onclick = () => panel.classList.remove('open');
  sendBtn.onclick = () => handleMessage(input.value);
  input.onkeypress = (e) => { if (e.key === 'Enter') handleMessage(input.value); };
})();
