import { motion } from "framer-motion"

const StepIndicator = ({ steps, currentStep }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '12px',
      padding: '32px 0',
      marginBottom: '24px'
    }}>
      {steps.map((step, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Step Circle */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{
              scale: index === currentStep ? 1.1 : 1,
              backgroundColor: index <= currentStep ? 'var(--color-primary)' : '#e0e0e0'
            }}
            transition={{ duration: 0.3 }}
            style={{
              width: index === currentStep ? '48px' : '40px',
              height: index === currentStep ? '48px' : '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: index === currentStep ? '18px' : '16px',
              boxShadow: index === currentStep ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            whileHover={{ scale: 1.05 }}
            title={step.title}
          >
            {index <= currentStep ? (
              index < currentStep ? '✓' : index + 1
            ) : (
              index + 1
            )}
          </motion.div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: '40px',
                backgroundColor: index < currentStep ? 'var(--color-primary)' : '#e0e0e0'
              }}
              transition={{ duration: 0.3 }}
              style={{
                height: '3px',
                borderRadius: '2px'
              }}
            />
          )}
        </div>
      ))}

      {/* Step Title - Mobile Friendly */}
      <div style={{
        position: 'absolute',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        width: '100%',
        padding: '0 20px'
      }}>
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '500',
            color: 'var(--color-text)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {steps[currentStep].title}
        </motion.p>
      </div>
    </div>
  )
}

export default StepIndicator
