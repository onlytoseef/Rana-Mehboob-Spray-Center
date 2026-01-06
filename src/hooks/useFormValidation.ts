import { useState, useCallback } from 'react';

interface ValidationSchema {
    [key: string]: {
        required?: boolean;
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
        pattern?: RegExp;
        custom?: (value: any) => string | null;
    };
}

interface UseFormValidationResult<T> {
    values: T;
    errors: { [key: string]: string };
    handleChange: (name: keyof T, value: any) => void;
    validate: () => boolean;
    reset: (newValues?: T) => void;
    setValues: (values: T) => void;
}

function useFormValidation<T extends Record<string, any>>(
    initialValues: T,
    schema: ValidationSchema
): UseFormValidationResult<T> {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleChange = useCallback((name: keyof T, value: any) => {
        setValues(prev => ({ ...prev, [name]: value }));
        // Clear error when field changes
        setErrors(prev => ({ ...prev, [name]: '' }));
    }, []);

    const validate = useCallback((): boolean => {
        const newErrors: { [key: string]: string } = {};

        Object.keys(schema).forEach(key => {
            const rules = schema[key];
            const value = values[key];

            if (rules.required && (!value || value === '')) {
                newErrors[key] = 'This field is required';
                return;
            }

            if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
                newErrors[key] = `Minimum ${rules.minLength} characters required`;
                return;
            }

            if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
                newErrors[key] = `Maximum ${rules.maxLength} characters allowed`;
                return;
            }

            if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
                newErrors[key] = `Minimum value is ${rules.min}`;
                return;
            }

            if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
                newErrors[key] = `Maximum value is ${rules.max}`;
                return;
            }

            if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
                newErrors[key] = 'Invalid format';
                return;
            }

            if (rules.custom) {
                const customError = rules.custom(value);
                if (customError) {
                    newErrors[key] = customError;
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [values, schema]);

    const reset = useCallback((newValues?: T) => {
        setValues(newValues || initialValues);
        setErrors({});
    }, [initialValues]);

    return { values, errors, handleChange, validate, reset, setValues };
}

export default useFormValidation;
