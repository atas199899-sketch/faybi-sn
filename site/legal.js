import {WHATSAPP_GATEWAY} from '/app/js/config.js';
if (WHATSAPP_GATEWAY) document.getElementById('wa').href = 'https://wa.me/' + WHATSAPP_GATEWAY;
