/*
 * Google Home Hack sample program
 * Copyright (c) 2018 Cybozu
 *
 * Licensed under the MIT License
*/

(() => {
    'use strict';
    // Install necessary modules
    const functions = require('firebase-functions');
    const {WebhookClient} = require('dialogflow-fulfillment');
    const req = require('request');
    const moment = require('moment');

    // kintone app information (Need edit)
    const subdomain = '×××';
    const appId = '×××';
    const token = '×××';

    // Enables library debugging statements
    process.env.DEBUG = 'dialogflow:debug';

    exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
        const agent = new WebhookClient({ request, response });
        console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
        console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

        // Function for AddMessage Intent
        const addMessage = (agent) => {
            const parameters = request.body.queryResult.parameters;
            const date = moment(parameters.date).format('YYYY-MM-DD');

            // HTTP Request header
            const headers = {
                'Content-Type': 'application/json',
                'X-Cybozu-API-Token': token
            };

            // HTTP Request body
            const form = {
                'app': appId,
                'record': {
                    'Message': {
                        'value': parameters.message
                    },
                    'Date': {
                        'value': date
                    }
                }
            };

            const options = {
                url: 'https://' + subdomain + '.cybozu.com/k/v1/record.json',
                method: 'POST',
                headers: headers,
                json: form
            };

            // HTTP POST Request
            return new Promise((resolve, reject) => {
                return req(options, (error, resp, body) => {
                    if (body) {
                        resolve(agent.add(date + 'でkintoneに' + parameters.message + 'を登録しました'));
                    } else if (error) {
                        resolve(agent.add('エラーが発生しました。コンソールをご確認ください'));
                    }
                });
            }).catch(error => {
                resolve(agent.add(error));
            });
        }

        // Function for CheckMessage Intent
        const checkMessage = (agent) => {

            // HTTP Request header
            const headers = {
                'Content-Type': 'application/json',
                'X-Cybozu-API-Token': token
            };

            // HTTP Request body
            const form = {
                'app': appId,
                'query': 'Date = TODAY()',
                'fields': ['Message']
            };

            const options = {
                url: 'https://' + subdomain + '.cybozu.com/k/v1/records.json',
                method: 'GET',
                headers: headers,
                json: form
            };

            // HTTP Get Request
            return new Promise((resolve, reject) => {
                return req(options, (error, resp, body) => {
                    if (body) {
                        const messages = body.records.map((record) => {
                            return record.Message.value;
                        });
                        if (messages.length === 0) {
                            resolve(agent.add('今日のメッセージはありません'));
                        } else if (messages.length > 0) {
                            resolve(agent.add('今日のメッセージは' + messages + 'です'));
                        }
                    } else if (error) {
                        resolve(agent.add('エラーが発生しました。コンソールをご確認ください'));
                    }
                });
            }).catch(error => {
                resolve(agent.add(error));
            });
        }

        // Run the proper function handler based on the matched Dialogflow intent name
        let intentMap = new Map();
        intentMap.set('AddMessage', addMessage);
        intentMap.set('CheckMessage', checkMessage);
        agent.handleRequest(intentMap);
    });
})();
