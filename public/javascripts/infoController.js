function setInfo(infoType, infoDiv, message) {
    if (infoType === 'ok') {
        if (infoDiv.classList.contains('info-err')) infoDiv.classList.remove('info-err');
		if (!infoDiv.classList.contains('info-ok')) infoDiv.classList.add('info-ok');
    } else if (infoType === 'err') {
        if (infoDiv.classList.contains('info-ok')) infoDiv.classList.remove('info-ok');
        if (!infoDiv.classList.contains('info-err')) infoDiv.classList.add('info-err');
    } else {
        throw new Error('Unknown infoType. (Maybe only `ok` or `err`)');
    }
    
    if (infoDiv.hidden) infoDiv.hidden = false;
	infoDiv.textContent = message;
} 