// src/screens/AIInsightsScreen.js - AI Finance Insights powered by Gemini
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Linking
} from 'react-native';
import { getTransactions } from '../utils/storage';

const AIInsightsScreen = () => {
    // STATE
    const [income, setIncome] = useState('');
    const [expenses, setExpenses] = useState([
        { category: 'Food', amount: '' },
        { category: 'Transport', amount: '' },
        { category: 'Entertainment', amount: '' },
        { category: 'Bills', amount: '' }
    ]);
    const [insights, setInsights] = useState('');
    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState(''); // API key will be entered by user
    const [showApiInput, setShowApiInput] = useState(true); // Show API input for user to enter key

    // Load existing transactions on mount
    useEffect(() => {
        loadExistingData();
    }, []);

    const loadExistingData = async () => {
        try {
            const transactions = await getTransactions();

            // Calculate total income and expenses from existing transactions
            const totalIncome = transactions
                .filter(tx => tx.type === 'income')
                .reduce((sum, tx) => sum + tx.amount, 0);

            const totalExpenses = transactions
                .filter(tx => tx.type === 'expense')
                .reduce((sum, tx) => sum + tx.amount, 0);

            if (totalIncome > 0) {
                setIncome(totalIncome.toString());
            }

            // Group expenses by category
            const expensesByCategory = {};
            transactions
                .filter(tx => tx.type === 'expense')
                .forEach(tx => {
                    const category = tx.description || 'Other';
                    expensesByCategory[category] = (expensesByCategory[category] || 0) + tx.amount;
                });

            // Update expenses array with actual data
            if (Object.keys(expensesByCategory).length > 0) {
                const newExpenses = Object.entries(expensesByCategory).map(([category, amount]) => ({
                    category,
                    amount: amount.toString()
                }));
                setExpenses(newExpenses);
            }
        } catch (error) {
            console.error('Error loading existing data:', error);
        }
    };

    // UPDATE EXPENSE AMOUNT
    const updateExpense = (index, value) => {
        const newExpenses = [...expenses];
        newExpenses[index].amount = value;
        setExpenses(newExpenses);
    };

    // UPDATE EXPENSE CATEGORY
    const updateExpenseCategory = (index, value) => {
        const newExpenses = [...expenses];
        newExpenses[index].category = value;
        setExpenses(newExpenses);
    };

    // ADD NEW EXPENSE CATEGORY
    const addExpense = () => {
        setExpenses([...expenses, { category: '', amount: '' }]);
    };

    // OPEN API KEY SETUP
    const openApiSetup = () => {
        Alert.alert('AI API Key', 'Contact support for AI API key setup instructions.');
    };

    // TEST API KEY
    const testApiKey = async () => {
        if (!apiKey) {
            Alert.alert('No API Key', 'Please enter an API key first');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                'https://api-inference.huggingface.co/models/gpt2',
                {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({
                        inputs: 'Say "Hello, API key is working!"'
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Test API Error:', errorData);
                Alert.alert('API Key Test Failed', `Error ${response.status}: ${errorData}`);
                return;
            }

            const data = await response.json();
            console.log('Test API Response:', data);
            Alert.alert('API Key Test Success', 'Your API key is working correctly! ✅');
        } catch (err) {
            console.error('Test API Error:', err);
            Alert.alert('API Key Test Failed', `Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // DEMO AI INSIGHTS (No API needed)
    const getDemoInsights = () => {
        const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        const savings = (parseFloat(income) || 0) - totalExpenses;
        const savingsRate = income > 0 ? ((savings / parseFloat(income)) * 100).toFixed(1) : 0;

        const demoInsights = `🤖 AI Financial Analysis (Demo Mode)

1. [Category Analysis] - Your biggest expense category appears to be ${expenses.find(e => e.amount)?.category || 'Food'}. Consider tracking this more closely to identify savings opportunities.

2. [Savings Status] - With a ${savingsRate}% savings rate, you're ${savingsRate >= 20 ? 'doing excellent! This is above the recommended 20% for Nigerian entrepreneurs' : savingsRate >= 10 ? 'on the right track, but try to reach 20% savings rate for better financial security' : 'below the recommended 20% savings rate. Focus on reducing expenses or increasing income'}.

3. [Action Item] - This month, try the 50/30/20 rule: 50% for needs, 30% for wants, 20% for savings. Start by reducing your largest expense category by 10%.

4. [Positive Note] - You're actively tracking your finances, which puts you ahead of 80% of small business owners in Nigeria! Keep building this habit for long-term success.

💡 Tip: Use your voice recorder to capture every transaction - even small ones add up over time!`;

        setInsights(demoInsights);
    };

    // CALL GEMINI AI
    const getAIInsights = async () => {
        // Validation
        if (!apiKey) {
            Alert.alert('API Key Required', 'Please enter your Gemini API key first!');
            return;
        }

        if (!income || parseFloat(income) <= 0) {
            Alert.alert('Invalid Income', 'Please enter a valid income amount');
            return;
        }

        const validExpenses = expenses.filter(e => e.amount && parseFloat(e.amount) > 0);
        if (validExpenses.length === 0) {
            Alert.alert('No Expenses', 'Please enter at least one expense');
            return;
        }

        setLoading(true);
        setInsights('');

        try {
            // Calculate totals
            const totalExpenses = validExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            const savings = parseFloat(income) - totalExpenses;

            // Build expense breakdown
            const expenseList = validExpenses
                .map(e => `${e.category}: ₦${parseFloat(e.amount).toLocaleString()}`)
                .join('\n');

            // Create prompt for Gemini (Nigerian context)
            const prompt = `You are a financial advisor for Nigerian entrepreneurs. Analyze this monthly budget and provide 4 specific, actionable insights:

FINANCIAL DATA:
Monthly Income: ₦${parseFloat(income).toLocaleString()}
Total Expenses: ₦${totalExpenses.toLocaleString()}
Net Savings: ₦${savings.toLocaleString()}

EXPENSE BREAKDOWN:
${expenseList}

Provide exactly 4 insights in this format:
1. [Category Analysis] - Analyze the biggest spending category
2. [Savings Status] - Comment on their savings rate (good savings rate is 20%+ in Nigeria)
3. [Action Item] - One specific thing they should do this month
4. [Positive Note] - One thing they're doing well

Keep each insight to 1-2 sentences. Be encouraging but honest. Use Nigerian context and mention Naira amounts.`;

            // Call AI API
            const response = await fetch(
                'https://api-inference.huggingface.co/models/gpt2',
                {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({
                        inputs: prompt
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.text();
                console.error('API Error Response:', errorData);
                throw new Error(`API call failed (${response.status}): ${errorData}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (data && data[0] && data[0].generated_text) {
                const aiResponse = data[0].generated_text;
                setInsights(aiResponse);
                setShowApiInput(false); // Hide API input after successful call
            } else if (data && typeof data === 'string') {
                setInsights(data);
                setShowApiInput(false);
            } else {
                throw new Error('Invalid response format from API');
            }

        } catch (err) {
            console.error('Full error:', err);
            Alert.alert('Error', `Failed to get AI insights: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Calculate summary stats
    const totalExpenses = expenses.reduce((sum, e) => {
        return sum + (parseFloat(e.amount) || 0);
    }, 0);
    const savings = (parseFloat(income) || 0) - totalExpenses;
    const savingsRate = income > 0 ? ((savings / parseFloat(income)) * 100).toFixed(1) : 0;

    return (
        <ScrollView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.title}>🤖 AI Finance Insights</Text>
                <Text style={styles.subtitle}>Get personalized financial advice powered by AI</Text>
            </View>

            {/* API KEY SECTION */}
            <View style={styles.apiKeySection}>
                <TouchableOpacity
                    style={styles.apiKeyToggle}
                    onPress={() => setShowApiInput(!showApiInput)}
                >
                    <Text style={styles.apiKeyToggleText}>
                        {showApiInput ? '🔒 Hide API Key Setup' : '🔑 Setup AI API Key'}
                    </Text>
                </TouchableOpacity>

                {showApiInput && (
                    <View style={styles.apiKeyInputSection}>
                        <Text style={styles.apiKeyTitle}>AI API Key Configuration</Text>
                        <Text style={styles.apiKeyInstructions}>
                            Enter your AI API key to get personalized financial insights.
                        </Text>

                        <TouchableOpacity style={styles.openApiButton} onPress={openApiSetup}>
                            <Text style={styles.openApiButtonText}>🔗 Get AI API Key</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.testApiButton} onPress={testApiKey}>
                            <Text style={styles.testApiButtonText}>🧪 Test API Key</Text>
                        </TouchableOpacity>

                        <TextInput
                            style={styles.apiKeyInput}
                            value={apiKey}
                            onChangeText={setApiKey}
                            placeholder="Paste your AI API key here..."
                            secureTextEntry={true}
                            multiline={false}
                        />
                        <Text style={styles.apiKeyNote}>Your key stays in your device (not stored anywhere)</Text>
                    </View>
                )}
            </View>

            {/* INCOME INPUT */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>💰 Monthly Income (₦)</Text>
                <TextInput
                    style={styles.input}
                    value={income}
                    onChangeText={setIncome}
                    placeholder="e.g., 300000"
                    keyboardType="numeric"
                />
            </View>

            {/* EXPENSES INPUT */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Monthly Expenses (₦)</Text>
                {expenses.map((expense, index) => (
                    <View key={index} style={styles.expenseRow}>
                        <TextInput
                            style={[styles.input, styles.categoryInput]}
                            value={expense.category}
                            onChangeText={(value) => updateExpenseCategory(index, value)}
                            placeholder="Category (e.g., Food)"
                        />
                        <TextInput
                            style={[styles.input, styles.amountInput]}
                            value={expense.amount}
                            onChangeText={(value) => updateExpense(index, value)}
                            placeholder="Amount"
                            keyboardType="numeric"
                        />
                    </View>
                ))}

                <TouchableOpacity style={styles.addButton} onPress={addExpense}>
                    <Text style={styles.addButtonText}>+ Add Another Expense</Text>
                </TouchableOpacity>
            </View>

            {/* SUMMARY */}
            <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Quick Summary</Text>
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Income</Text>
                        <Text style={styles.summaryValue}>₦{parseFloat(income || 0).toLocaleString()}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Expenses</Text>
                        <Text style={styles.summaryValue}>₦{totalExpenses.toLocaleString()}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Savings</Text>
                        <Text style={[styles.summaryValue, { color: savings >= 0 ? '#28a745' : '#dc3545' }]}>
                            ₦{savings.toLocaleString()}
                        </Text>
                    </View>
                </View>
                <View style={styles.savingsRateContainer}>
                    <Text style={styles.summaryLabel}>Savings Rate</Text>
                    <Text style={[styles.savingsRate, { color: savingsRate >= 20 ? '#28a745' : savingsRate >= 10 ? '#ffc107' : '#dc3545' }]}>
                        {savingsRate}%
                    </Text>
                </View>
            </View>

            {/* GET INSIGHTS BUTTON */}
            {/* Demo Insights Button - Works Without API */}
            <TouchableOpacity
                style={styles.demoInsightsButton}
                onPress={getDemoInsights}
            >
                <Text style={styles.demoInsightsButtonText}>🎯 Get Smart Insights (Works Now!)</Text>
            </TouchableOpacity>

            {/* Real AI Insights Button */}
            <TouchableOpacity
                style={[styles.insightsButton, loading && styles.insightsButtonDisabled]}
                onPress={getAIInsights}
                disabled={loading}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color="white" size="small" />
                        <Text style={styles.insightsButtonText}>Analyzing...</Text>
                    </View>
                ) : (
                    <Text style={styles.insightsButtonText}>🔧 Try External AI (May Fail)</Text>
                )}
            </TouchableOpacity>

            {/* AI INSIGHTS */}
            {insights && (
                <View style={styles.insightsSection}>
                    <Text style={styles.insightsTitle}>🤖 AI-Powered Insights</Text>
                    <Text style={styles.insightsText}>{insights}</Text>
                </View>
            )}

            <View style={styles.bottomPadding} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#007AFF',
        padding: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'white',
        textAlign: 'center',
        opacity: 0.9,
    },
    apiKeySection: {
        backgroundColor: '#e8f5e8',
        margin: 15,
        padding: 15,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#28a745',
    },
    apiKeyToggle: {
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    apiKeyToggleText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    apiKeyInputSection: {
        marginTop: 10,
    },
    apiKeyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#856404',
        marginBottom: 10,
    },
    apiKeyInstructions: {
        fontSize: 14,
        color: '#856404',
        marginBottom: 15,
        lineHeight: 20,
    },
    openApiButton: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
    },
    openApiButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    testApiButton: {
        backgroundColor: '#17a2b8',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
    },
    testApiButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    apiKeyInput: {
        borderWidth: 2,
        borderColor: '#ffeaa7',
        borderRadius: 8,
        padding: 12,
        backgroundColor: 'white',
        marginBottom: 8,
    },
    apiKeyNote: {
        fontSize: 12,
        color: '#856404',
    },
    section: {
        backgroundColor: 'white',
        margin: 15,
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    input: {
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: 'white',
    },
    expenseRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    categoryInput: {
        flex: 2,
    },
    amountInput: {
        flex: 1,
    },
    addButton: {
        marginTop: 10,
        padding: 10,
    },
    addButtonText: {
        color: '#007AFF',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    summarySection: {
        backgroundColor: '#007AFF',
        margin: 15,
        padding: 20,
        borderRadius: 15,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 15,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        color: 'white',
        opacity: 0.9,
        marginBottom: 5,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    savingsRateContainer: {
        alignItems: 'center',
    },
    savingsRate: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    insightsButton: {
        backgroundColor: '#007AFF',
        margin: 15,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    insightsButtonDisabled: {
        backgroundColor: '#ccc',
    },
    insightsButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    demoInsightsButton: {
        backgroundColor: '#28a745',
        margin: 15,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#28a745',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    demoInsightsButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    insightsSection: {
        backgroundColor: 'white',
        margin: 15,
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    insightsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    insightsText: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
    },
    bottomPadding: {
        height: 50,
    },
});

export default AIInsightsScreen;