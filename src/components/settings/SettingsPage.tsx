import { Box, createStyles, Paper, Theme, Typography, useMediaQuery, useTheme } from "@material-ui/core";
import React, { useContext, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Form, Formik, FormikErrors } from "formik";
import SaveChangesSnackbar from "../common/SaveChangesSnackbar";
import AppContext, { Business } from "../../context/AppContext";
import _ from "lodash";
import { TextField } from "formik-material-ui";
import HelpIcon from '@material-ui/icons/Help';
import Tooltip from '@material-ui/core/Tooltip';
import { isDomain } from "../../util/Validate";
import { updateBusiness } from "../../services/businessService";
import { Alert } from "@material-ui/lab";
import { APP_URL } from "../../config/axios";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        container: {},
        item: {},
        typography: {
            textAlign: 'center',
            color: 'lightgray',
            margin: '15px'
        },
        paper: {
            padding: '25px',
            margin: '20px',
            flex: '1 1 0px'
        },
        fieldDiv: {
            marginTop: '20px',
            marginBottom: '20px'
        },
        field: {
            width: '85%',
            margin: '8px 0px'
        },
        helpIcon: {
            marginLeft: '10px'
        },
        mainTitle: {
            color: 'ghostwhite',
            marginBottom: '20px'
        },
        option: {},
        ul: {
            listStyle: "none",
            padding: 0
        },
        sectionTypography: {
            color: 'gray'
        },
    }));

export default function () {

    const classes = useStyles();

    const context = useContext(AppContext);

    const [saved, setSaved] = useState(true);
    const [error, setError] = useState('');

    const theme = useTheme();

    const { business } = context;
    const { translations } = business.config;
    const bigScreen = useMediaQuery(theme.breakpoints.up('md'));

    // If changed will update the state so the snackbar opens
    const validateAndSnackbar = (value: Business) => {
        const errors: FormikErrors<Business> = {};
        if (!errors.config) errors.config = {}
        if (value.config.loyaltyWebsite?.trim() && !isDomain(value.config.loyaltyWebsite)) {
            errors.config.loyaltyWebsite = "That doesn't look like a domain!"
        }
        if (!_.isEqual(value, business)) {
            setSaved(false);
            console.log(value, business)
        }
        return errors;
    }

    return (
        <div>
            <Typography className={classes.typography} variant="h5">Your loyalty app pages</Typography>
            {error.length > 0 && <Alert severity="error">{error}</Alert>}
            <Formik
                initialValues={business}
                validateOnBlur
                validate={validateAndSnackbar}
                onSubmit={(updatedBusiness, actions) => {
                    actions.setSubmitting(true)
                    updateBusiness(business)
                        .then(() => actions.setSubmitting(false))
                        .catch(err => setError(err.response?.data?.message || err.toString()))
                }}
            >
                {({ submitForm, isSubmitting }) => (
                    <Box display="flex" flexDirection={bigScreen ? "row" : "column"}>
                        <Paper className={classes.paper}>
                            <Typography className={classes.sectionTypography} variant="h6" align="center">
                                Translations & Names
                            </Typography>
                            <Form>
                                <div className={classes.fieldDiv}>
                                    {Object.keys(translations).map(k => {

                                            const { plural, singular, placeholder } = translations[k];
                                            return (
                                                <div key={k}>
                                                    {plural && <TextField
                                                        className={classes.field}
                                                        name={`config.translations.${k}.plural`}
                                                        type="text"
                                                        label={`"${k}" translation (plural)`}
                                                        placeholder={placeholder}
                                                    />
                                                    }
                                                    {(!!plural || !!singular) && <Tooltip
                                                        enterDelay={200}
                                                        leaveDelay={300}
                                                        title={
                                                            <React.Fragment>
                                                                <Typography>{`Name or translation for "${k}"`}</Typography>
                                                                {`Choose a custom name or translation that will replace "${k}".`}
                                                                <p>{placeholder}</p>
                                                            </React.Fragment>
                                                        }
                                                    >
                                                        <HelpIcon className={classes.helpIcon}/>
                                                    </Tooltip>
                                                    }
                                                    {singular && <TextField
                                                        className={classes.field}
                                                        name={`config.translations.${k}.singular`}
                                                        type="text"
                                                        label={`"${k}" translation (singular)`}
                                                        placeholder={placeholder}
                                                    />
                                                    }
                                                </div>
                                            )
                                        }
                                    )}
                                </div>
                            </Form>
                        </Paper>

                        <Paper className={classes.paper}>
                            <Typography className={classes.sectionTypography} variant="h6" align="center">
                                Other
                            </Typography>
                            <Form>
                                <TextField
                                    className={classes.field}
                                    name="config.loyaltyWebsite"
                                    type="text"
                                    label="Your loyalty app domain"
                                    placeholder="yourdomain.com"
                                />
                                <Tooltip
                                    enterDelay={200}
                                    leaveDelay={300}
                                    title={
                                        <React.Fragment>
                                            <Typography>{`Your domain`}</Typography>
                                            Redirect your domain (or a subdomain) to "{APP_URL}" and enter your domain here
                                        </React.Fragment>
                                    }
                                >
                                    <HelpIcon className={classes.helpIcon}/>
                                </Tooltip>
                            </Form>
                        </Paper>

                        <SaveChangesSnackbar
                            open={!saved}
                            buttonDisabled={isSubmitting}
                            onSave={submitForm}
                        />
                    </Box>
                )}
            </Formik>
        </div>
    )
}