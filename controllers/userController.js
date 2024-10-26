const ApiError = require('../error/ApiError')
const uuid = require('uuid')
const path = require("path");
const fs = require('fs')
const {User} = require('../models/models')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {where} = require("sequelize");
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateJWT = (id, email, role, fio, profilePhoto, tokenGPT, mainPrompt) => {
 return jwt.sign({id, email, role, fio, profilePhoto: profilePhoto, tokenGPT, mainPrompt}, process.env.SECRET_KEY, {expiresIn: '24h'})
}

class UserController {
    async registration(req, res, next) {
        const {email, password, FIO, role, tokenGPT} = req.body
        if (!email || !password || !FIO || !tokenGPT) {
            next(ApiError.badRequest('Некорректные данные'))
        }
        const candidate = await User.findOne({where: {email}})
        if (candidate) {
            next(ApiError.badRequest('Пользователь с таким email уже существует'))
        }

        const hashPassword = await bcrypt.hash(password, 5)
        const user = await User.create({email, password: hashPassword, FIO, tokenGPT})
        const token = generateJWT(user.id, user.email, user.role, user.FIO, user.profilePhoto, user.tokenGPT, user.mainPrompt)
        res.json({token})
    }

    async login(req, res, next) {
        const {email, password} = req.body
        const user = await User.findOne({where: {email}})
        if (!user) {
            return next(ApiError.internal('Данный пользователь не найден'))
        }

        let comparePassword = bcrypt.compareSync(password, user.password)
        if (!comparePassword) {
            return next(ApiError.internal('Неверный пароль'))
        }

        const token = generateJWT(user.id, user.email, user.role, user.FIO, user.profilePhoto, user.tokenGPT, user.mainPrompt)
        return res.json({token})
    }

    async loginGoogle (req, res, next) {
        // не надо let token = req.body.token.toString()
        //вопрос для паши, на откладке чекнуть
        /*let token = req.body.token
        let token2 = 'test ' + token*/
        try {
            const ticket = await client.verifyIdToken({
                idToken: req.body.token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            const userId = parseInt(payload['sub'],10);
            const email = payload['email'];
            const name = payload['name'];
            const picture = payload['picture'];

            let user = await User.findOne({ where: { email } })

            if (!user) {
                user = await User.create({
                    FIO: name,
                    role: 'USER',
                    tokenGPT: '',
                    email: email,
                    profilePhoto: picture,
                });
            }

            const token = generateJWT(user.id, user.email, user.role, user.FIO, user.profilePhoto, user.tokenGPT, user.mainPrompt)
            return res.json({token})
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async check(req, res, next) {
        const token = generateJWT(req.user.id, req.user.email, req.user.role, req.user.fio, req.user.profilePhoto, req.user.tokenGPT, req.user.mainPrompt)
        return res.json({token})
    }

    async getToken(req, res, next) {
        try {
            const {id} = req.user
            const user = await User.findOne({where: {id}})
            res.json(user.tokenGPT)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async changeProfile(req, res, next) {
        try {

            const {email, FIO, tokenGPT, mainPrompt} = req.body
            const result = await User.update({email, FIO, tokenGPT, mainPrompt}, {
                where: {
                    id: req.user.id
                }
            });
            console.log(`Updated ${result[0]} rows`);
            const token = generateJWT(req.user.id, email, req.user.role, FIO, req.user.profilePhoto, tokenGPT, mainPrompt)
            res.status(200).json({message: 'Данные профиля успешно обновлены', token: token});
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async changePass(req, res, next) {
        try {
            const {id} = req.user
            const user = await User.findOne({where: {id}})
            let {password, newPassword} = req.body
            let comparePassword = bcrypt.compareSync(password, user.password)
            if (!comparePassword) {
                res.status(500).json({message: 'Неверный пароль'});
                return
            }
            newPassword = await bcrypt.hash(newPassword, 5)
            await User.update(
                {password: newPassword},
                {
                    where: {
                        id: user.id
                    }
                }
            )

            res.status(200).json({message: 'Пароль успешно изменен'});
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async addPhotoInProfile(req, res, next) {
        try {
            const userId = req.user.id.toString()
            const {profilePhoto} = req.files
            const fileExtension = profilePhoto.name.split('.').pop();
            const fileName = req.user.id + "." + fileExtension;
            const imgUser = path.join(path.resolve(), 'staticImages')

            await profilePhoto.mv(path.join(imgUser, fileName))

            await User.update(
                {
                    profilePhoto: fileName,
                },
                {
                    where: {
                        id: userId
                    }
                }
            )
            const token = generateJWT(req.user.id, req.user.email, req.user.role, req.user.fio, fileName, req.user.tokenGPT, req.user.mainPrompt)
            res.json({message: 'Фото профиля успешно обновлено', token});


        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }
}

module.exports = new UserController()