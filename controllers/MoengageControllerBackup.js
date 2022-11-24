require('dotenv').config();
const express = require('express');
// const { QueryTypes, json } = require('sequelize');
const { QueryTypes } = require('@sequelize/core');
const models = require('../models');
const Sequelize = require('sequelize');
const bodyParser = require('body-parser');
const dbConn = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    port: 3306,
    logging: false,
    dialectOptions: {
      requestTimeout: 30000,
      encrypt: true
    }
})

const getAllMoengage = async(req, res) => {
    const resMoengage = await models.Moengage.findAll({});
    const mEvents = await models.Events.findAll({});
    const mEventAttr = await models.EventAttribute.findAll({});
    if (resMoengage.length > 0) {
        res.status(200).send({
            status: 200,
            message: "Success to fetch moengage events",
            data: resMoengage,
            dataEvents: mEvents,
            dataEventAttr: mEventAttr
        });
    } else {
        res.status(404).send({
            status: 404,
            message: "Data Not Found"
        });
    }
}

const getAssociationMoe = async(req, res) => {
    await models.Moengage.findAll({
        order: [
            ['created_at', 'DESC']
        ],
    }).then(moeList => {
        Promise.all(moeList).then((post) => {
            const eventList = models.Events;
            for (let i = 0; i < moeList.length; i++) {
                eventList.findAll({
                    where: {
                        moe_req_id: post[i].moe_req_id
                    },
                    order: [
                        ['event_uuid', 'ASC']
                    ],
                })
            }
        })
    });
}

const storeStreams = async(req, res) => {
    const modelMoe = await models.Moengage;
    const mEvents = await models.Events;
    const mEventAttr = await models.EventAttribute;
    const mUserAttr = await models.UserAttribute;
    const mDeviceAttr = await models.DeviceAttribute;
    const mLogStreams = await models.LogAttributeStreams;
    const tx = await dbConn.transaction();
    try {
        // const { appName, source, moeReqID, events } = req.body;
        const { app_name, export_doc_id, events } = req.body;
        let eventObj = req.body.events;
        // -------------------------------------
        // Start Of storing of moengage campaign 
        // -------------------------------------
        const insMoe = await modelMoe.create({
            app_name: req.body.appName,
            source: req.body.source,
            moe_req_id: req.body.moeReqID,
            created_at: new Date(),
        }, { transaction : tx });
        if (insMoe) {
            // -------------------------------------------------------
            // Start Of storing every each events of moengage campaign 
            // --------------------------------------------------------
            let eventLength = eventObj.length;
            for (let i = 0; i < eventLength; i++) {
                await mEvents.create({
                    moe_req_id: insMoe['moe_req_id'],
                    event_code: eventObj[i]['event_code'],
                    event_name: eventObj[i]['event_name'],
                    event_time: eventObj[i]['event_time'],
                    event_type: eventObj[i]['event_type'],
                    event_source: eventObj[i]['event_source'],
                    push_id: eventObj[i]['push_id'],
                    uid: eventObj[i]['uid'],
                    campaign_id: eventObj[i]['campaign_id'],
                    created_at: insMoe['created_at']
                }, { transaction : tx });
            }
            tx.commit();
            let recordOfEvent = [];
            const queryEvent = await models.Events.findAll({
                where: {
                    moe_req_id: insMoe.moe_req_id
                },
                order: [
                    ['event_uuid', 'ASC']
                ],
            }).then(function (record) {
                if(record.length > 0) {
                    for (let a = 0; a < record.length; a++) {
                        recordOfEvent[a] = record[a];
                    }
                    dataEvents = record;
                    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-0123456789';
                    const charactersLength = characters.length;
                    let maxLength = 25;
                    let arrIdEvnAttr = [];
                    let arrIdUsrAttr = [];
                    let arrIdDvcAttr = [];
                    for (let n = 0; n < eventLength; n++) {
                        for (let k = 0; k < maxLength; k++ ) {
                            arrIdEvnAttr[n] += characters.charAt(Math.floor(Math.random() * charactersLength));
                            arrIdUsrAttr[n] += characters.charAt(Math.floor(Math.random() * charactersLength));
                            arrIdDvcAttr[n] += characters.charAt(Math.floor(Math.random() * charactersLength));
                        }
                    }
                    for (let x = 0; x < arrIdEvnAttr.length; x++) {
                        arrIdEvnAttr[x] = {
                            'event_attr_id_insert': arrIdEvnAttr[x].replace('undefined','code'),
                        };
                        arrIdUsrAttr[x] = {
                            'user_attr_id_insert': arrIdUsrAttr[x].replace('undefined','code'),
                        };
                        arrIdDvcAttr[x] = {
                            'device_attr_id_insert': arrIdDvcAttr[x].replace('undefined','code'),
                        };
                    }
                    // -------------------------------------
                    // Start Of : Store every each attribute of events
                    // -------------------------------------
                    for (let j = 0; j < eventLength; j++) {
                        if(eventObj[j].event_attributes.length != 0) {
                            mEventAttr.create({
                                id: arrIdEvnAttr[j]['event_attr_id_insert'],
                                campaign_id: dataEvents[j]['campaign_id'],
                                event_uuid: dataEvents[j]['event_uuid'],
                                campaign_name: eventObj[j]['event_attributes']['campaign_name'],
                                campaign_type: eventObj[j]['event_attributes']['campaign_type'],
                                campaign_channel: eventObj[j]['event_attributes']['campaign_channel'],
                                created_at: insMoe['created_at'],
                            });
                        }

                        if(eventObj[j]['user_attributes'].length != 0) {
                            mUserAttr.create({
                                id: arrIdUsrAttr[j]['user_attr_id_insert'],
                                uid: dataEvents[j]['uid'],
                                event_uuid: dataEvents[j]['event_uuid'],
                                name: eventObj[j]['user_attributes']['name'],
                                email: eventObj[j]['user_attributes']['email'],
                                phone: eventObj[j]['event_attributes']['phone'],
                                created_at: insMoe['created_at'],
                            });
                        }

                        if(eventObj[j]['device_attributes'].length != 0) {
                            mDeviceAttr.create({
                                id: arrIdDvcAttr[j]['device_attr_id_insert'],
                                push_id: dataEvents[j]['push_id'],
                                event_uuid: dataEvents[j]['event_uuid'],
                                device_id: eventObj[j]['device_attributes']['device_id'],
                                device_name: eventObj[j]['device_attributes']['device_name'],
                                created_at: insMoe['created_at'],
                            });
                        }   
                        // -----------------------------
                        // Start Of Store In Log Streams
                        // -----------------------------
                        mLogStreams.create({
                            moe_id: insMoe.id,
                            event_uuid: dataEvents[j].event_uuid,
                            attribute_type: 'event_attributes',
                            attribute_key: 'campaign_id',
                            attribute_value: dataEvents[j]['event_uuid'],
                            created_at: insMoe['created_at']
                        });
                        mLogStreams.create({
                            moe_id: insMoe.id,
                            event_uuid: dataEvents[j].event_uuid,
                            attribute_type: 'event_attributes',
                            attribute_key: 'campaign_name',
                            attribute_value: eventObj[j]['event_attributes']['campaign_name'],
                            created_at: insMoe['created_at']
                        });
                        mLogStreams.create({
                            moe_id: insMoe.id,
                            event_uuid: dataEvents[j].event_uuid,
                            attribute_type: 'event_attributes',
                            attribute_key: 'campaign_type',
                            attribute_value: eventObj[j]['event_attributes']['campaign_type'],
                            created_at: insMoe['created_at']
                        });
                        mLogStreams.create({
                            moe_id: insMoe.id,
                            event_uuid: dataEvents[j].event_uuid,
                            attribute_type: 'event_attributes',
                            attribute_key: 'email',
                            attribute_value: eventObj[j]['user_attributes']['email'],
                            created_at: insMoe['created_at']
                        }).then(function (logStreams) {
                            // ----------
                            // User Attr
                            // ----------
                            mLogStreams.create({
                                moe_id: insMoe.id,
                                event_uuid: dataEvents[j].event_uuid,
                                attribute_type: 'user_attributes',
                                attribute_key: 'uid',
                                attribute_value: dataEvents[j]['uid'],
                                created_at: insMoe['created_at']
                            });
                            mLogStreams.create({
                                moe_id: insMoe.id,
                                event_uuid: dataEvents[j].event_uuid,
                                attribute_type: 'user_attributes',
                                attribute_key: 'campaign_id',
                                attribute_value: dataEvents[j]['campaign_id'],
                                created_at: insMoe['created_at']
                            });
                            mLogStreams.create({
                                moe_id: insMoe.id,
                                event_uuid: dataEvents[j].event_uuid,
                                attribute_type: 'user_attributes',
                                attribute_key: 'name',
                                attribute_value: eventObj[j]['user_attributes']['name'],
                                created_at: insMoe['created_at']
                            });
                            mLogStreams.create({
                                moe_id: insMoe.id,
                                event_uuid: dataEvents[j].event_uuid,
                                attribute_type: 'user_attributes',
                                attribute_key: 'email',
                                attribute_value: eventObj[j]['user_attributes']['email'],
                                created_at: insMoe['created_at']
                            });
                            mLogStreams.create({
                                moe_id: insMoe.id,
                                event_uuid: dataEvents[j].event_uuid,
                                attribute_type: 'user_attributes',
                                attribute_key: 'phone',
                                attribute_value: eventObj[j]['user_attributes']['phone'],
                                created_at: insMoe['created_at']
                            });
                            // ----------------------------------------
                            // Device Attribute
                            // -------------------------------------
                            mLogStreams.create({
                                moe_id: insMoe.id,
                                event_uuid: dataEvents[j].event_uuid,
                                attribute_type: 'device_attributes',
                                attribute_key: 'push_id',
                                attribute_value: dataEvents[j]['push_id'],
                                created_at: insMoe['created_at']
                            });
                            mLogStreams.create({
                                moe_id: insMoe.id,
                                event_uuid: dataEvents[j].event_uuid,
                                attribute_type: 'device_attributes',
                                attribute_key: 'device_id',
                                attribute_value: eventObj[j]['device_attributes']['device_id'],
                                created_at: insMoe['created_at']
                            });
                            mLogStreams.create({
                                moe_id: insMoe.id,
                                event_uuid: dataEvents[j].event_uuid,
                                attribute_type: 'device_attributes',
                                attribute_key: 'device_name',
                                attribute_value: eventObj[j]['device_attributes']['device_name'],
                                created_at: insMoe['created_at']
                            });
                            // -----------------------------
                            // End Of Store In Log Streams
                            // -----------------------------
                        });
                    }
                    res.status(200).send({
                        message: "Success to store moengage events",
                        moeInsert: insMoe,
                        evnInsert: recordOfEvent,
                        event_attribute_id: arrIdEvnAttr, 
                        user_attribute_id: arrIdUsrAttr, 
                        device_attribute_id: arrIdDvcAttr
                    });
                } else {
                    tx.rollback();
                    res.status(400).send({
                        status: 400,
                        message: "Failed to fetch event"
                    });
                }
            });
        }
    } catch (error) {
        tx.rollback();
        res.status(400).send({
            status: 400,
            message: error
        });
        console.log(error);
    }
}
// -------------------
// END
// -------------------
// input = finaccel
const testNested = async(req, res) => {
    const str = 'finaccel';
    let strSplit = str.split("");
    const funcNewStr = newStr(strSplit);
    let response = [{
        'f': 0,
        'i': 0,
        'n': 0,
        'a': 0,
        'c': 0,
        'e': 0,
        'l': 0,
    }];
    for (let j = 0; j < strSplit.length; j++) {
        for (let i = 0; i < funcNewStr.length; i++) {
            if(funcNewStr[i] == strSplit[j] && funcNewStr[i] == 'f') {
                response[0]['f'] = response[0]['f']+=1;
            } else if(funcNewStr[i] == strSplit[j] && funcNewStr[i] == 'i') {
                response[0]['i'] = response[0]['i']+=1;
            } else if(funcNewStr[i] == strSplit[j] && funcNewStr[i] == 'n') {
                response[0]['n'] = response[0]['n']+=1
            } else if(funcNewStr[i] == strSplit[j] && funcNewStr[i] == 'a') {
                response[0]['a'] = response[0]['a']+=1;
            } else if(funcNewStr[i] == strSplit[j] && funcNewStr[i] == 'c') {
                response[0]['c'] = response[0]['c']+=1;
            } else if(funcNewStr[i] == strSplit[j] && funcNewStr[i] == 'e') {
                response[0]['e'] = response[0]['e']+=1;
            } else if(funcNewStr[i] == strSplit[j] && funcNewStr[i] == 'l') {
                response[0]['l'] = response[0]['l']+=1;
            } 
        }
    }
    res.status(400).send({
        status: 400,
        data: response
    });
}

function newStr(strSplit) {
    let uniqueChars = strSplit.filter((c, index) => {
        return strSplit.indexOf(c) === index;
    });
    return uniqueChars;
}

module.exports = { getAllMoengage, storeStreams, getAssociationMoe, testNested };