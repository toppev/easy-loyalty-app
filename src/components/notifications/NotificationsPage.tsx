import React, { useContext, useState } from "react";
import { Box, createStyles, Theme, useMediaQuery, useTheme } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import NotificationForm from "./NotificationForm";
import { PushNotification } from "./PushNotification";
import AppContext from "../../context/AppContext";
import NotificationHistory from "./NotificationHistory";
import useRequest from "../../hooks/useRequest";
import { listNotificationHistory } from "../../services/pushNotificationService";
import useResponseState from "../../hooks/useResponseState";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        box: {
            "& > .MuiPaper-root": {
                height: '550px',
                margin: '20px 6px',
                width: '550px',
                [theme.breakpoints.up('lg')]: {
                    margin: '25px',
                },
            }
        },
    }));

export default function () {

    const classes = useStyles();
    const context = useContext(AppContext);

    const [cooldownExpires, setCooldownExpires] = useState<Date | undefined>();
    const [newNotifications, setNewNotifications] = useState<PushNotification[]>([]);

    const { loading, error, response } = useRequest(listNotificationHistory);
    const [history, setHistory] = useResponseState<PushNotification[]>(response, [], res => {
        const expires = res.data.cooldownExpires;
        setCooldownExpires(expires ? new Date(expires) : undefined)
        return res.data.notifications.map((it: any) => new PushNotification(it))
    });

    // IDEA: maybe a google maps link if website doesn't exist but the address does?
    const initialNotification = new PushNotification({
        title: '',
        message: '',
        link: context.business.public.website,
        date: new Date()
    });

    const notificationSubmitted = (notification: PushNotification) => setNewNotifications([...newNotifications, notification]);

    return (
        <div>
            <Box display="flex" flexWrap="wrap"
                 className={classes.box}>
                <NotificationForm
                    onSubmitted={notificationSubmitted}
                    notification={initialNotification}
                    cooldownExpires={cooldownExpires}
                    setCooldownExpires={setCooldownExpires}
                />
                <NotificationHistory
                    history={history}
                    loading={loading}
                    error={error}
                    newNotifications={newNotifications}
                />
            </Box>
        </div>
    )

}