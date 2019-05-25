let res_final = {};
let big_res = '';

Array.from(document.getElementsByClassName('activity-anime_list')).forEach(entry => {
    let timeDiv = entry.getElementsByClassName('time')[0];
    let time = timeDiv.getElementsByTagName('time')[0].getAttribute('title');
    let [s, day, month, year, hour, minute, second, ...r] = time.match(/([0-9]+)\/([0-9]+)\/([0-9]+), ([0-9]+):([0-9]+):([0-9]+)/i);
    let date = new Date(year, month - 1, day, hour, minute, second);

    let title = entry.getElementsByClassName('title')[0].textContent.trim();
    let status = entry.getElementsByClassName('status')[0].textContent.replace(title, '').trim();

    let episodes = status.match(/Watched episode ([0-9]*)( - ([0-9]*)|) of/i);
    let EPISODES_LENGHTS = [{}];

    if (!(title in res_final))
        res_final[title] = '';

    if (episodes) {
        let [t, ep1, m, ep2, ...q] = episodes;
        ep2 = (ep2 === undefined) ? ep1 : ep2;
        let ep_length = EPISODES_LENGHTS[title] || 24;

        for (let ep = parseInt(ep2); ep >= parseInt(ep1); ep--) {
            date.setMinutes(date.getMinutes() - ep_length);
            res_final[title] += `Ep ${ep}, watched on ${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} at ${("0" + date.getHours()).slice(-2)}:${("0" + date.getMinutes()).slice(-2)} Remove\n`;
        }
    }
    if (status === 'Completed') {
        res_final[title] += `Ep Final, watched on ${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} at ${("0" + date.getHours()).slice(-2)}:${("0" + date.getMinutes()).slice(-2)} Remove\n`;
    }
});

Object.keys(res_final).forEach(title => {
    if (res_final[title].split('\n').length > 1)
        big_res += `${title} Episode Details\n${res_final[title]}\n`;
});

console.log(big_res);
