const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const getUnis = async () => {
    const res = await fetch('https://www.stw.berlin/mensen.html').then(res => res.text());
    const { document } = (new JSDOM(res)).window;

    const unis = [
        ...document
            .getElementById('itemsHochschulen')
            .querySelectorAll('.container-fluid')
    ].map(wrapper => {
        const uniName = wrapper.querySelector('button.accordion > h4').textContent
        const canteens = [
            ...wrapper.querySelectorAll('.panel .col-md-4')
        ].map(canteenWrapper => {
            const canteenId = canteenWrapper
                .querySelector('[onclick^="xhrLoad"]')
                .getAttribute('onclick')
                .match(/xhrLoad\('(\d+)'\)/)[1];

            const [name, ...address] = canteenWrapper
                .querySelector('.addrcard')
                .textContent
                .trim()
                .split(/\r?\n/);

            return {
                canteenId,
                name,
                address: address.map(str => str.trim())
            };
        });

        return {
            name: uniName,
            canteens
        }
    });

    return unis;
};

const getMenuByCanteenId = async (canteenId, dayString) => {
    const url = dayString
        ? 'https://www.stw.berlin/xhr/speiseplan-wochentag.html'
        : 'https://www.stw.berlin/xhr/speiseplan-und-standortdaten.html';

    let reqBody = `resources_id=${canteenId}`;
    dayString && (reqBody += `&date=${dayString}`);

    const mealPlanResponse = await fetch(
        url,
        {
            method: 'POST',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: reqBody
        }
    ).then(res => res.text());

    const { document } = (new JSDOM(mealPlanResponse)).window;

    const getLegend = () => {
        const legend = {};

        const legendElement = document.querySelector('#legende');

        if (legendElement) {
            [...legendElement.querySelectorAll('.row')].map(row => {
                if (!row.querySelector('img')) {
                    const [id, description] = [...row.children].map(el => {
                        if (el.childElementCount === 0) {
                            return el.textContent
                        }
                    });
                    legend[id] = description;
                }
            });

            return legend;
        } else {
            return null;
        }

    }

    const legend = getLegend();

    const menu = [
        ...document.querySelectorAll('.splGroupWrapper')
    ].flatMap(wrapper => {
        const mealGroup = wrapper.querySelector('.splGroup').textContent;
        const meals = [...wrapper.querySelectorAll('.splMeal')].map(mealWrapper => {
            const name = mealWrapper.querySelector('span.bold').textContent.trim();

            const pricesArray = mealWrapper
                .querySelector('.text-right')
                .textContent
                .split('/')
                .map(str => str.replace(/[^\d,\.]/g, ''));
            const price = {
                'student': pricesArray[0],
                'employee': pricesArray[1],
                'guest': pricesArray[2],
            };

            const additives = {};
            const additiveIds = mealWrapper.getAttribute('lang').split(',');
            additiveIds.forEach(id => {
                if (id || id === '0') {
                    additives[id] = legend ? legend[id] : null;
                }
            });

            return {
                name,
                price,
                additives,
                mealGroup
            };
        });

        return meals;
    });

    return {
        menu,
        legend
    };
};

(async function () {
    const { menu, legend } = await getMenuByCanteenId(537);
    const unis = await getUnis();

    console.log(unis);
    console.log(menu);
    console.log(legend);
}());

module.exports.getUnis = getUnis;
module.exports.getMenuByCanteenId = getMenuByCanteenId;
