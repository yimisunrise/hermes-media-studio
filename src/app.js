import { bootstrapFramework } from './framework/app.js';
import { bootstrapBusiness } from './business/index.js';

function startMediaStudio() {
  const CID = 'media-studio-app';
  let container = document.getElementById(CID);
  if (!container) {
    container = document.createElement('div');
    container.id = CID;
    container.style.display = 'none';
    const main = document.querySelector('.main');
    (main || document.body).appendChild(container);
  }

  bootstrapFramework(container).then(ctx => bootstrapBusiness(ctx));
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  startMediaStudio();
} else {
  document.addEventListener('DOMContentLoaded', startMediaStudio);
}

export default { bootstrapFramework, bootstrapBusiness };
