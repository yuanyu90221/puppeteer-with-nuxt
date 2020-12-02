const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const blueBird = require('bluebird');
dotenv.config();
const testAdminLogin = async ({exec_id}) => {

    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    let isSuccess = false;
    try {
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(process.env.WEBSITE_URI);
        await page.click('[data-cypress-id="loginBtn"]');
        await page.screenshot({ path: `redpill_web_login_modal${exec_id}.png`, fullPage: true });
        await page.type('[data-cypress-id="loginEmailInput"]', process.env.USER);
        await page.type('[data-cypress-id="loginPasswdInput"]', process.env.PASSWD);
        await page.click('[data-cypress-id="confirmLoginBtn"]');
        
        await page.waitForNavigation();
        // Get cookies
        const cookies = await page.cookies();
        const session = cookies.filter(item => item.name === 'session')[0];
        // console.log('cookies value', session);
        const result = JSON.parse(decodeURIComponent( session.value));
        console.log('cookies', {...result});
        await page.screenshot({ path: `redpill_profile${exec_id}.png`, fullPage: true });
        // click admin
        await page.click('[data-cypress-id="adminNavBtn"]');
        await page.waitForNavigation();
        await page.screenshot({ path: `redpill_admin${exec_id}.png`, fullPage: true });
        isSuccess = true;
    } catch (err) {
        console.log(`${exec_id} error`, err);
        throw err;
    } finally {
        await browser.close();
        return { exec_id, isSuccess };
    }
};
(async() => {
    let failCount = 0;
    const taskSetNumber = 10;
    const taskTotal = 8;
    for (let taskIdx = 0 ; taskIdx < taskSetNumber; taskIdx ++)  {
        let offset = 0;
        try {
            console.time(`testAmdinLogin${taskIdx}`)
            const taskQueue = [];
            offset += taskIdx*taskTotal
            for (let taskid = offset ; taskid < offset + taskTotal; taskid++) {
                taskQueue.push(testAdminLogin({ exec_id: taskid }))
            }
            const result = await Promise.all(taskQueue);
            failCount  += result.filter((item)=>item.isSuccess === false).length;
            console.log('failedCount:' , failCount);
            console.log(result);
        } catch(err) {
            console.log(`testAmdinLogin${taskIdx} error`, err);
        } finally {
            console.timeEnd(`testAmdinLogin${taskIdx}`);
        }
    }
    console.log('failedRate:', Math.floor(100 * failCount / (taskSetNumber * taskTotal) ), '%')
})()